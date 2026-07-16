// routes/form.routes.js
const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const db       = require("../config/db");
const workflowExecution = require("../services/workflowExecution.service");

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

// ─── FILE UPLOAD (multer) ─────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../uploads/forms");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },           // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error("Only PDF, JPG, and PNG files are allowed."));
  },
});

// ─── TRACKING ID GENERATOR ────────────────────────────────────────────────────
async function nextTrackingId() {
  const year = new Date().getFullYear();
  const [[{ count }]] = await db.query(
    "SELECT COUNT(*) AS count FROM form_submissions WHERE YEAR(created_at) = ?", [year]
  );
  const seq = String(count + 1).padStart(5, "0");
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
router.post("/submit", requireAuth, upload.single("file"), async (req, res) => {
  const { student_id, full_name, category, filing_date, college_year = "", section = "" } = req.body;

  if (!student_id || !full_name || !category || !filing_date)
    return res.status(400).json({ message: "student_id, full_name, category, and filing_date are required." });

  try {
    const tracking_id = await nextTrackingId();
    const file_url    = req.file ? `/uploads/forms/${req.file.filename}` : null;
    const file_name   = req.file ? req.file.originalname : null;

    const [result] = await db.query(
      `INSERT INTO form_submissions
         (tracking_id, submitted_by, student_id, full_name, category, filing_date, file_url, file_name, college_year, section, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
      [tracking_id, req.user.id, student_id, full_name, category, filing_date, file_url, file_name, college_year, section]
    );

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

    return res.status(201).json({ message: "Form submitted successfully.", form: rows[0] });
  } catch (err) {
    console.error("POST /forms/submit error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/forms/draft — save as draft ───────────────────────────────────
router.post("/draft", requireAuth, upload.single("file"), async (req, res) => {
  const { student_id, full_name, category, filing_date } = req.body;

  try {
    const tracking_id = await nextTrackingId();
    const file_url    = req.file ? `/uploads/forms/${req.file.filename}` : null;
    const file_name   = req.file ? req.file.originalname : null;

    const [result] = await db.query(
      `INSERT INTO form_submissions
         (tracking_id, submitted_by, student_id, full_name, category, filing_date, file_url, file_name, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', NOW())`,
      [tracking_id, req.user.id, student_id || "", full_name || "", category || "Other", filing_date || new Date().toISOString().split("T")[0], file_url, file_name]
    );

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

    const file_url  = req.file ? `/uploads/forms/${req.file.filename}` : form.file_url;
    const file_name = req.file ? req.file.originalname : form.file_name;
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