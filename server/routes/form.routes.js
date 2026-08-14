// routes/form.routes.js
//
// ─── MIGRATION NEEDED ──────────────────────────────────────────────────────
// To persist the faculty's Step 2 dynamic field answers (Last Name, Section,
// Masterlist, etc.) so they can be shown on the review screen, add:
//
//   ALTER TABLE form_submissions ADD COLUMN field_values JSON NULL;
//
// (Use TEXT instead of JSON if your MySQL version doesn't support the JSON
// type.) The routes below already work without this column — they'll just
// log a warning and skip saving the field answers until it's added.
//
// ─── FIX (this version): attachments now go to R2, not local disk ─────────
// This router previously used multer.diskStorage() to write uploaded form
// files straight onto the server's local filesystem (uploads/forms/...) and
// stored that relative path in file_url. On Render (and most hosts) that
// filesystem is ephemeral, so files could vanish on redeploy/restart, and it
// was inconsistent with task.routes.js, which already uploads every file to
// R2 and stores a full https:// URL. All three upload sites below (/submit,
// /draft, /:id/resubmit) now upload to R2 via the same ../utils/uploadToR2
// helper task.routes.js uses, so file_url is always a full R2 URL and the
// frontend's resolveFileUrl() helper renders it correctly everywhere.
//
// ─── NEW (this version): persistent "form submitted" notification ─────────
// Previously the only signal a program chair/admin got that a form had come
// in was the "new_form_submission" socket emit to the "program_chairs"
// room — live-only, so it was gone forever for anyone not connected at that
// exact instant (page not open, reconnecting, server just restarted). This
// adds a notify() helper (same shape/behavior as the one in task.routes.js)
// that writes a row to the shared `notifications` table for every active
// admin/program_chair and emits the generic "notification" event alongside
// it, so submissions show up in the Notifications page/bell on load via
// GET /api/notifications, not just as a toast you had to be online to see.
// Fires on both the initial /submit and on /:id/resubmit.
const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const multer   = require("multer");
const db       = require("../config/db");
const workflowExecution = require("../services/workflowExecution.service");
const { uploadToR2 } = require("../utils/uploadToR2");

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized." });
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireReviewer(req, res, next) {
  if (!["admin", "program_chair"].includes(req.user?.role))
    return res.status(403).json({ message: "Reviewer access required." });
  next();
}

// ─── HELPER: persist + push a notification ────────────────────────────────────
// Mirrors notify() in task.routes.js exactly (same `notifications` table,
// same payload shape) so anything already listening for the generic
// "notification" socket event (see Notifications.jsx) picks this up too,
// with no changes needed on the frontend. Never throws — a notification
// failing to save should never take down the request that triggered it.
async function notify(io, { userId, type, title, message, taskId = null, trackingId = null }) {
  if (userId == null) return null;
  try {
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, task_id, tracking_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [userId, type, title, message, taskId, trackingId]
    );
    const payload = {
      id: result.insertId,
      user_id: userId,
      type,
      title,
      message,
      task_id: taskId,
      tracking_id: trackingId,
      is_read: 0,
      created_at: new Date().toISOString(),
    };
    if (io) io.to(`user_${userId}`).emit("notification", payload);
    return payload;
  } catch (err) {
    console.error("notify() failed to persist notification:", err);
    return null;
  }
}

// Notifies every active admin/program_chair that a form was (re)submitted —
// both a persisted row (via notify() above, so it survives a refresh/
// reconnect) and the existing live "new_form_submission" room-wide emit
// (kept as-is, in case anything still listens for it directly).
async function notifyReviewersOfFormSubmission(io, form) {
  try {
    const [reviewers] = await db.query(
      "SELECT id FROM users WHERE role IN ('admin', 'program_chair') AND is_active = 1"
    );
    const submitterName = form.submitter_name || form.full_name || "A faculty member";
    const message = `${submitterName} submitted a form (${form.category}) — ${form.tracking_id}`;

    for (const reviewer of reviewers) {
      await notify(io, {
        userId: reviewer.id,
        type: "form_submitted",
        title: "Form Submitted",
        message,
        trackingId: form.tracking_id,
      });
    }
  } catch (err) {
    // Never let a notification failure block/roll back the submission itself.
    console.error("notifyReviewersOfFormSubmission() failed:", err);
  }
}

// ─── FILE UPLOAD (multer) ─────────────────────────────────────────────────────
// Files land in memory (not disk) so they can be streamed straight to R2 —
// same approach as task.routes.js.
const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },           // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = `.${(file.originalname.split(".").pop() || "").toLowerCase()}`;
    if (ALLOWED_EXTENSIONS.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF, JPG, and PNG files are allowed."));
  },
});

// Uploads a single buffered file to R2 and returns its public URL + name.
// Mirrors uploadFilesToR2() in task.routes.js, single-file form.
async function uploadOneToR2(file) {
  if (!file) return null;
  const { url } = await uploadToR2(file);
  return { url, originalname: file.originalname, size: file.size };
}

// ─── TRACKING ID GENERATOR ────────────────────────────────────────────────────
// FIX: This used to be based on COUNT(*) of rows created this year, which
// produces duplicate IDs whenever a row for the current year has been
// deleted (count drops, so count+1 collides with an ID already in use).
// Instead, derive the next sequence number from the highest sequence number
// actually in use for this year — deletions can no longer cause a collision.
async function nextTrackingId() {
  const year = new Date().getFullYear();
  const [[{ maxSeq }]] = await db.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(tracking_id, 11) AS UNSIGNED)), 0) AS maxSeq
     FROM form_submissions
     WHERE tracking_id LIKE ?`,
    [`FORM-${year}-%`]
  );
  const seq = String(maxSeq + 1).padStart(5, "0");
  return `FORM-${year}-${seq}`;
}

// ─── HELPER: build stats from a WHERE clause ──────────────────────────────────
async function buildStats(whereClause = "1=1", params = []) {
  const [[{ total }]]    = await db.query(`SELECT COUNT(*) AS total    FROM form_submissions WHERE ${whereClause}`, params);
  const [[{ pending }]]  = await db.query(`SELECT COUNT(*) AS pending  FROM form_submissions WHERE status = 'Pending'  AND ${whereClause}`, params);
  const [[{ approved }]] = await db.query(`SELECT COUNT(*) AS approved FROM form_submissions WHERE status = 'Approved' AND ${whereClause}`, params);
  const [[{ rejected }]] = await db.query(`SELECT COUNT(*) AS rejected FROM form_submissions WHERE status = 'Rejected' AND ${whereClause}`, params);
  const rejection_rate   = total > 0 ? `${((rejected / total) * 100).toFixed(1)}%` : "0%";
  return { total, pending, approved, rejected, rejection_rate };
}

// ════════════════════════════════════════════════════════════════════════════════
// FACULTY ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// ─── POST /api/forms/submit — faculty submits a form ─────────────────────────
router.post("/submit", requireAuth, upload.any(), async (req, res) => {
  const { category, filing_date, college_year = "", section = "" } = req.body;
  // Student Number / Full Name are no longer collected in the wizard UI —
  // fall back to the authenticated user's profile instead of hard-requiring them.
  const student_id = req.body.student_id || req.user.student_id || "";
  const full_name  = req.body.full_name  || req.user.full_name  || "";

  if (!category || !filing_date)
    return res.status(400).json({ message: "category and filing_date are required." });

  try {
    // req.files is an array now (upload.any()) instead of a single req.file.
    // Prefer the field literally named "file" (the primary/back-compat copy
    // the client always sends); otherwise fall back to the first file found.
    const primaryFile = (req.files || []).find(f => f.fieldname === "file") || (req.files || [])[0] || null;
    const uploaded  = await uploadOneToR2(primaryFile);
    const file_url  = uploaded ? uploaded.url : null;
    const file_name = uploaded ? uploaded.originalname : null;

    // The wizard's Step 2 sends a JSON summary of every dynamic field the
    // faculty member filled in (name -> displayable value), e.g.
    // { "Last Name": "Asuncion", "Masterlist": "transaction-summary.pdf" }.
    // Requires a `field_values` JSON/TEXT column on form_submissions — see
    // migration note above `nextTrackingId()`. Falls back gracefully if the
    // column hasn't been added yet, so this never blocks a submission.
    let field_values = null;
    try { field_values = req.body.field_values ? JSON.stringify(JSON.parse(req.body.field_values)) : null; }
    catch { field_values = null; }

    // FIX: nextTrackingId() + INSERT is not atomic, so under concurrent
    // submissions (or a retried request) two requests can still compute the
    // same tracking_id and race each other to the unique constraint. Retry
    // a few times on ER_DUP_ENTRY, regenerating the tracking_id each time,
    // instead of surfacing a generic 500 to the user.
    const MAX_ATTEMPTS = 5;
    let result, tracking_id;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      tracking_id = await nextTrackingId();
      try {
        [result] = await db.query(
          `INSERT INTO form_submissions
             (tracking_id, submitted_by, student_id, full_name, category, filing_date, file_url, file_name, college_year, section, field_values, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
          [tracking_id, req.user.id, student_id, full_name, category, filing_date, file_url, file_name, college_year, section, field_values]
        );
        break; // success
      } catch (insertErr) {
        if (insertErr.code === "ER_BAD_FIELD_ERROR") {
          console.warn("[forms] `field_values` column missing on form_submissions — run the migration to persist Step 2 field answers. Submitting without them for now.");
          try {
            [result] = await db.query(
              `INSERT INTO form_submissions
                 (tracking_id, submitted_by, student_id, full_name, category, filing_date, file_url, file_name, college_year, section, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
              [tracking_id, req.user.id, student_id, full_name, category, filing_date, file_url, file_name, college_year, section]
            );
            break; // success
          } catch (fallbackErr) {
            if (fallbackErr.code === "ER_DUP_ENTRY" && attempt < MAX_ATTEMPTS) {
              console.warn(`[forms] tracking_id collision on '${tracking_id}' (fallback insert), retrying (attempt ${attempt})...`);
              continue;
            }
            throw fallbackErr;
          }
        }
        if (insertErr.code === "ER_DUP_ENTRY" && attempt < MAX_ATTEMPTS) {
          console.warn(`[forms] tracking_id collision on '${tracking_id}', retrying (attempt ${attempt})...`);
          continue;
        }
        throw insertErr;
      }
    }

    const [rows] = await db.query(
      `SELECT fs.*, u.full_name AS submitter_name, u.email AS submitter_email
       FROM form_submissions fs
       LEFT JOIN users u ON u.id = fs.submitted_by
       WHERE fs.id = ?`,
      [result.insertId]
    );

    // Notify all connected program chairs in real time
    const io = req.app.get("io");
    if (io) io.to("program_chairs").emit("new_form_submission", rows[0]);

    // Persist a notification for every admin/program_chair (see helper
    // above) so the submission shows up in the Notifications page even for
    // reviewers who weren't connected at the moment it came in.
    await notifyReviewersOfFormSubmission(io, rows[0]);

    // Auto-start a workflow — no-op if no Published workflow has
    // auto_trigger_category matching this form's category. Runs AFTER the
    // submission already succeeded and is soft-failed, same as the
    // approve/reject/revise hooks below, so a workflow-side error can
    // never block or roll back a form submission.
    try {
      const matchedWorkflow = await workflowExecution.findAutoTriggerWorkflow(category);
      if (matchedWorkflow) {
        await workflowExecution.startWorkflowInstance({
          workflowId:  matchedWorkflow.id,
          subjectType: "form_submission",
          subjectId:   result.insertId,
          initiatedBy: req.user.id,
        });
      }
    } catch (wfErr) {
      console.error(`[workflow] auto-start failed for form_submission ${result.insertId}:`, wfErr);
    }

    return res.status(201).json({ message: "Form submitted successfully.", form: rows[0] });
  } catch (err) {
    console.error("POST /forms/submit error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/forms/draft — save as draft ───────────────────────────────────
router.post("/draft", requireAuth, upload.any(), async (req, res) => {
  const { student_id, full_name, category, filing_date } = req.body;

  try {
    // See the /submit route above for why this retries on ER_DUP_ENTRY.
    const MAX_ATTEMPTS = 5;
    let result, tracking_id;

    const primaryFile = (req.files || []).find(f => f.fieldname === "file") || (req.files || [])[0] || null;
    const uploaded  = await uploadOneToR2(primaryFile);
    const file_url  = uploaded ? uploaded.url : null;
    const file_name = uploaded ? uploaded.originalname : null;

    let field_values = null;
    try { field_values = req.body.field_values ? JSON.stringify(JSON.parse(req.body.field_values)) : null; }
    catch { field_values = null; }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      tracking_id = await nextTrackingId();
      try {
        [result] = await db.query(
          `INSERT INTO form_submissions
             (tracking_id, submitted_by, student_id, full_name, category, filing_date, file_url, file_name, field_values, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', NOW())`,
          [tracking_id, req.user.id, student_id || "", full_name || "", category || "Other", filing_date || new Date().toISOString().split("T")[0], file_url, file_name, field_values]
        );
        break;
      } catch (colErr) {
        if (colErr.code === "ER_BAD_FIELD_ERROR") {
          console.warn("[forms] `field_values` column missing on form_submissions — run the migration to persist Step 2 field answers. Saving draft without them for now.");
          try {
            [result] = await db.query(
              `INSERT INTO form_submissions
                 (tracking_id, submitted_by, student_id, full_name, category, filing_date, file_url, file_name, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', NOW())`,
              [tracking_id, req.user.id, student_id || "", full_name || "", category || "Other", filing_date || new Date().toISOString().split("T")[0], file_url, file_name]
            );
            break;
          } catch (fallbackErr) {
            if (fallbackErr.code === "ER_DUP_ENTRY" && attempt < MAX_ATTEMPTS) {
              console.warn(`[forms] tracking_id collision on '${tracking_id}' (fallback insert), retrying (attempt ${attempt})...`);
              continue;
            }
            throw fallbackErr;
          }
        }
        if (colErr.code === "ER_DUP_ENTRY" && attempt < MAX_ATTEMPTS) {
          console.warn(`[forms] tracking_id collision on '${tracking_id}', retrying (attempt ${attempt})...`);
          continue;
        }
        throw colErr;
      }
    }

    const [rows] = await db.query("SELECT * FROM form_submissions WHERE id = ?", [result.insertId]);
    return res.status(201).json({ message: "Draft saved.", form: rows[0] });
  } catch (err) {
    console.error("POST /forms/draft error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/forms/my — faculty's own submissions ───────────────────────────
router.get("/my", requireAuth, async (req, res) => {
  const { page = 1, per_page = 5, q = "" } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(per_page);
  const like   = `%${q}%`;

  try {
    const [forms] = await db.query(
      `SELECT * FROM form_submissions
       WHERE submitted_by = ?
         AND (tracking_id LIKE ? OR full_name LIKE ? OR student_id LIKE ? OR category LIKE ?)
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, like, like, like, like, parseInt(per_page), offset]
    );

    const [[{ total_count }]] = await db.query(
      `SELECT COUNT(*) AS total_count FROM form_submissions
       WHERE submitted_by = ?
         AND (tracking_id LIKE ? OR full_name LIKE ? OR student_id LIKE ? OR category LIKE ?)`,
      [req.user.id, like, like, like, like]
    );

    const stats = await buildStats("submitted_by = ?", [req.user.id]);

    return res.json({
      forms,
      stats,
      total_pages: Math.ceil(total_count / parseInt(per_page)),
      total_count,
    });
  } catch (err) {
    console.error("GET /forms/my error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// PROGRAM CHAIR / ADMIN ROUTES
// ════════════════════════════════════════════════════════════════════════════════

// ─── GET /api/forms/all — all submissions (review queue) ─────────────────────
router.get("/all", requireAuth, requireReviewer, async (req, res) => {
  const { page = 1, per_page = 5, q = "", status = "" } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(per_page);
  const like   = `%${q}%`;

  try {
    const statusFilter = status ? "AND fs.status = ?" : "";
    const statusParam  = status ? [status] : [];

    const [forms] = await db.query(
      `SELECT fs.*,
              u.full_name  AS submitter_name,
              u.email      AS submitter_email,
              r.full_name  AS reviewer_name
       FROM form_submissions fs
       LEFT JOIN users u ON u.id = fs.submitted_by
       LEFT JOIN users r ON r.id = fs.reviewed_by
       WHERE (fs.tracking_id LIKE ? OR fs.full_name LIKE ? OR fs.student_id LIKE ? OR fs.category LIKE ?)
         ${statusFilter}
       ORDER BY
         CASE fs.status WHEN 'Pending' THEN 0 WHEN 'Reviewing' THEN 1 ELSE 2 END,
         fs.created_at DESC
       LIMIT ? OFFSET ?`,
      [like, like, like, like, ...statusParam, parseInt(per_page), offset]
    );

    const [[{ total_count }]] = await db.query(
      `SELECT COUNT(*) AS total_count FROM form_submissions fs
       WHERE (fs.tracking_id LIKE ? OR fs.full_name LIKE ? OR fs.student_id LIKE ? OR fs.category LIKE ?)
         ${statusFilter}`,
      [like, like, like, like, ...statusParam]
    );

    const stats = await buildStats();

    return res.json({
      forms,
      stats,
      total_pages: Math.ceil(total_count / parseInt(per_page)),
      total_count,
    });
  } catch (err) {
    console.error("GET /forms/all error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/forms/:id — single submission ───────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT fs.*,
              u.full_name AS submitter_name,
              u.email     AS submitter_email,
              r.full_name AS reviewer_name
       FROM form_submissions fs
       LEFT JOIN users u ON u.id = fs.submitted_by
       LEFT JOIN users r ON r.id = fs.reviewed_by
       WHERE fs.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Form not found." });

    // Faculty can only see their own
    const f = rows[0];
    if (!["admin","program_chair"].includes(req.user.role) && f.submitted_by !== req.user.id)
      return res.status(403).json({ message: "Forbidden." });

    return res.json(f);
  } catch (err) {
    console.error("GET /forms/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/forms/:id/approve ─────────────────────────────────────────────
router.post("/:id/approve", requireAuth, requireReviewer, async (req, res) => {
  const { note = "" } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM form_submissions WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Form not found." });

    await db.query(
      `UPDATE form_submissions
       SET status = 'Approved', review_note = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [note, req.user.id, req.params.id]
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${rows[0].submitted_by}`).emit("form_status_update", {
        tracking_id: rows[0].tracking_id,
        status: "Approved",
        review_note: note,
      });
    }

    // Persisted counterpart of the emit above — shows up in the submitter's
    // Notifications page/bell even if they weren't connected at the moment
    // this fired (page closed, reconnecting, etc.), same pattern as
    // notifyReviewersOfFormSubmission() for the reviewer side.
    await notify(io, {
      userId: rows[0].submitted_by,
      type: "form_approved",
      title: "Form Approved",
      message: `Your form ${rows[0].tracking_id} has been approved${note ? `: "${note}"` : ""}.`,
      trackingId: rows[0].tracking_id,
    });

    // Workflow integration — no-op if this form isn't attached to an active
    // instance. Runs AFTER the approve logic above, never instead of it, so
    // forms not attached to any workflow behave exactly as before.
    try {
      await workflowExecution.advanceWorkflow({
        subjectType: "form_submission",
        subjectId:   Number(req.params.id),
        edgeLabel:   "Approved",
        actionTaken: "Approval",
        performedBy: req.user.id,
        notes:       note,
      });
    } catch (wfErr) {
      console.error(`[workflow] advance failed for form_submission ${req.params.id}:`, wfErr);
      // Not surfaced to the client — the approval itself already succeeded
      // and must not be rolled back or blocked by a workflow-side error.
    }

    return res.json({ message: "Form approved." });
  } catch (err) {
    console.error("POST /forms/:id/approve error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/forms/:id/reject ──────────────────────────────────────────────
router.post("/:id/reject", requireAuth, requireReviewer, async (req, res) => {
  const { note = "" } = req.body;
  if (!note.trim()) return res.status(400).json({ message: "A rejection reason is required." });

  try {
    const [rows] = await db.query("SELECT * FROM form_submissions WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Form not found." });

    await db.query(
      `UPDATE form_submissions
       SET status = 'Rejected', review_note = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [note, req.user.id, req.params.id]
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${rows[0].submitted_by}`).emit("form_status_update", {
        tracking_id: rows[0].tracking_id,
        status: "Rejected",
        review_note: note,
      });
    }

    await notify(io, {
      userId: rows[0].submitted_by,
      type: "form_rejected",
      title: "Form Rejected",
      message: `Your form ${rows[0].tracking_id} was rejected: "${note}".`,
      trackingId: rows[0].tracking_id,
    });

    try {
      await workflowExecution.advanceWorkflow({
        subjectType: "form_submission",
        subjectId:   Number(req.params.id),
        edgeLabel:   "Rejected",
        actionTaken: "Rejection",
        performedBy: req.user.id,
        notes:       note,
      });
    } catch (wfErr) {
      console.error(`[workflow] advance failed for form_submission ${req.params.id}:`, wfErr);
    }

    return res.json({ message: "Form rejected." });
  } catch (err) {
    console.error("POST /forms/:id/reject error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ── POST /api/forms/:id/revise ───────────────────────────────────────────────
router.post("/:id/revise", requireAuth, requireReviewer, async (req, res) => {
  const { note = "" } = req.body;
  if (!note.trim()) return res.status(400).json({ message: "A revision note is required." });

  try {
    const [rows] = await db.query("SELECT * FROM form_submissions WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Form not found." });

    await db.query(
      `UPDATE form_submissions
       SET status = 'Revision', review_note = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [note, req.user.id, req.params.id]
    );

    console.log(`[REVISE] Form ${req.params.id} set to Revision. Notifying user_${rows[0].submitted_by}`);

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${rows[0].submitted_by}`).emit("form_status_update", {
        tracking_id: rows[0].tracking_id,
        status: "Revision",
        review_note: note,
      });
      console.log(`[REVISE] Socket emit sent to user_${rows[0].submitted_by}`);
    } else {
      console.log("[REVISE] io not found on app!");
    }

    await notify(io, {
      userId: rows[0].submitted_by,
      type: "form_revision",
      title: "Revision Requested",
      message: `Your form ${rows[0].tracking_id} needs revision: "${note}".`,
      trackingId: rows[0].tracking_id,
    });

    try {
      await workflowExecution.advanceWorkflow({
        subjectType: "form_submission",
        subjectId:   Number(req.params.id),
        edgeLabel:   "Revision",
        actionTaken: "Return for Revision",
        performedBy: req.user.id,
        notes:       note,
      });
    } catch (wfErr) {
      console.error(`[workflow] advance failed for form_submission ${req.params.id}:`, wfErr);
    }

    return res.json({ message: "Revision requested." });
  } catch (err) {
    console.error("POST /forms/:id/revise error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ── POST /api/forms/:id/resubmit ────────────────────────────────────────────
router.post("/:id/resubmit", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM form_submissions WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Form not found." });

    const form = rows[0];

    if (form.submitted_by !== req.user.id)
      return res.status(403).json({ message: "Forbidden." });

    if (form.status !== "Revision")
      return res.status(400).json({ message: "Only forms marked for revision can be resubmitted." });

    const uploaded   = await uploadOneToR2(req.file);
    const file_url   = uploaded ? uploaded.url : form.file_url;
    const file_name  = uploaded ? uploaded.originalname : form.file_name;
    const { college_year, section } = req.body;

    await db.query(
      `UPDATE form_submissions
       SET status = 'Pending', file_url = ?, file_name = ?, college_year = ?, section = ?,
           review_note = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = NOW()
       WHERE id = ?`,
      [file_url, file_name, college_year || form.college_year, section || form.section, req.params.id]
    );

    const [updated] = await db.query(
      `SELECT fs.*, u.full_name AS submitter_name, u.email AS submitter_email
       FROM form_submissions fs
       LEFT JOIN users u ON u.id = fs.submitted_by
       WHERE fs.id = ?`,
      [req.params.id]
    );

    const io = req.app.get("io");
    if (io) io.to("program_chairs").emit("new_form_submission", updated[0]);

    // Same persisted notification as the initial /submit — a resubmission
    // is effectively a new thing for reviewers to look at, so it should
    // land in their Notifications page too, not just the live room emit.
    await notifyReviewersOfFormSubmission(io, updated[0]);

    return res.status(200).json({ message: "Form resubmitted successfully.", form: updated[0] });
  } catch (err) {
    console.error("POST /forms/:id/resubmit error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
// FORM TEMPLATES
// ════════════════════════════════════════════════════════════════════════════════

// ─── GET /api/forms/templates — list all active templates ────────────────────
router.get("/templates", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM form_templates WHERE is_active = 1 ORDER BY category, name"
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /forms/templates error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/forms/templates — add a template (reviewer only) ──────────────
router.post("/templates", requireAuth, requireReviewer, async (req, res) => {
  const { name, category, description = "", required_fields = "" } = req.body;
  if (!name || !category)
    return res.status(400).json({ message: "name and category are required." });

  try {
    const [result] = await db.query(
      `INSERT INTO form_templates (name, category, description, required_fields, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, category, description, required_fields, req.user.id]
    );
    const [rows] = await db.query("SELECT * FROM form_templates WHERE id = ?", [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /forms/templates error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── DELETE /api/forms/templates/:id — deactivate a template ─────────────────
router.delete("/templates/:id", requireAuth, requireReviewer, async (req, res) => {
  try {
    await db.query("UPDATE form_templates SET is_active = 0 WHERE id = ?", [req.params.id]);
    return res.json({ message: "Template deactivated." });
  } catch (err) {
    console.error("DELETE /forms/templates/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;

// ─── ERROR HANDLER — must be registered after this router in app.js, e.g.:
//     app.use("/api/forms", formRoutes, formRoutesErrorHandler);
// Catches multer errors (unexpected field, file too large, disallowed type)
// and any other error thrown inside a route above, and always responds with
// JSON so the frontend never has to fall back to a generic "Server error".
function formRoutesErrorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err.code, err.field);
    const messages = {
      LIMIT_FILE_SIZE: "File exceeds the 10MB limit.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field received.",
    };
    return res.status(400).json({ message: messages[err.code] || err.message });
  }
  if (err) {
    console.error("Unhandled forms route error:", err);
    return res.status(500).json({ message: err.message || "Internal server error." });
  }
  _next();
}

module.exports.errorHandler = formRoutesErrorHandler;