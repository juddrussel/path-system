// routes/user.routes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { writeLog } = require("./audit.routes");

// ─── DEFAULTS ──────────────────────────────────────────────────────────────────
const DEFAULT_DEPARTMENT = "Information Systems";

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

function requireAdminOrChair(req, res, next) {
  if (req.user?.role !== "admin" && req.user?.role !== "program_chair") {
    return res.status(403).json({ message: "Admin or Program Chair access required." });
  }
  next();
}

// ─── HELPER: split full_name → first_name / last_name ────────────────────────
function splitName(full_name = "") {
  const parts = full_name.trim().split(/\s+/);
  const first_name = parts[0] || "";
  const last_name = parts.slice(1).join(" ") || "";
  return { first_name, last_name };
}

// ─── GET /api/users — list all approved users (status = 'approved') ───────────
router.get("/", requireAuth, requireAdminOrChair, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, department, username, role, status,
              is_active, avatar_url, created_at, updated_at
       FROM users
       WHERE status = 'approved'
       ORDER BY created_at DESC`
    );
    const users = rows.map(u => ({ ...u, ...splitName(u.full_name) }));
    return res.json(users);
  } catch (err) {
    console.error("GET /users error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/users — admin creates a user directly (auto-approved) ──────────
router.post("/", requireAuth, requireAdminOrChair, async (req, res) => {
  const { first_name, last_name, username, email, phone, role, password, is_active, department } = req.body;

  if (!first_name || !username || !phone || !password || !role) {
    return res.status(400).json({ message: "first_name, username, phone, password, and role are required." });
  }

  try {
    const full_name = `${first_name} ${last_name || ""}`.trim();
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email || null]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Username or email already in use." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const active = is_active === undefined ? 1 : (is_active ? 1 : 0);
    // department is NOT NULL in the DB and the Add User form doesn't collect
    // it, so fall back to the org-wide default instead of null.
    const dept = department || DEFAULT_DEPARTMENT;

    // Admin-created users are automatically approved
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, department, username, password, role, status, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW())`,
      [full_name, email || null, phone, dept, username, hashed, role, active]
    );

    const [newUser] = await db.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    return res.status(201).json({ ...newUser[0], ...splitName(newUser[0].full_name) });
  } catch (err) {
    console.error("POST /users error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/users/stats ─────────────────────────────────────────────────────
router.get("/stats", requireAuth, requireAdminOrChair, async (req, res) => {
  try {
    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE status = 'approved'");
    const [[{ admins }]] = await db.query("SELECT COUNT(*) AS admins FROM users WHERE role IN ('admin','program_chair') AND status = 'approved'");
    const [[{ active }]] = await db.query("SELECT COUNT(*) AS active FROM users WHERE is_active = 1 AND status = 'approved'");
    const [[{ inactive }]] = await db.query("SELECT COUNT(*) AS inactive FROM users WHERE is_active = 0 AND status = 'approved'");
    const [[{ pending }]] = await db.query("SELECT COUNT(*) AS pending FROM users WHERE status = 'pending'");

    const [[{ approved_this_month }]] = await db.query(
      `SELECT COUNT(*) AS approved_this_month FROM users
       WHERE status = 'approved'
         AND MONTH(updated_at) = MONTH(NOW())
         AND YEAR(updated_at) = YEAR(NOW())`
    );

    const [[{ rejected_this_month }]] = await db.query(
      `SELECT COUNT(*) AS rejected_this_month FROM users
       WHERE status = 'rejected'
         AND MONTH(updated_at) = MONTH(NOW())
         AND YEAR(updated_at) = YEAR(NOW())`
    );

    return res.json({ total, admins, active, inactive, pending, approved_this_month, rejected_this_month });
  } catch (err) {
    console.error("GET /users/stats error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/users/pending — users awaiting approval ─────────────────────────
router.get("/pending", requireAuth, requireAdminOrChair, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, department, username, role, status, avatar_url, created_at
       FROM users
       WHERE status = 'pending'
       ORDER BY created_at DESC`
    );
    return res.json(rows.map(u => ({ ...u, ...splitName(u.full_name) })));
  } catch (err) {
    console.error("GET /users/pending error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/users/resolved — approved or rejected in last 30 days ───────────
router.get("/resolved", requireAuth, requireAdminOrChair, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, department, username, role, status,
              is_active, avatar_url, updated_at AS resolved_on
       FROM users
       WHERE status IN ('approved', 'rejected')
         AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       ORDER BY updated_at DESC`
    );

    const resolved = rows.map(u => ({
      ...u,
      ...splitName(u.full_name),
      decision: u.status,
      resolved_by: "Admin",
    }));

    return res.json(resolved);
  } catch (err) {
    console.error("GET /users/resolved error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/users/names — minimal id→name list, any authenticated user ──────
// Used by dashboards/tables (e.g. "Submitted By / Assigned To" columns) to
// resolve ids to display names without exposing email/phone/role/status,
// which is why this doesn't require requireAdminOrChair like GET / does.
router.get("/names", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, avatar_url FROM users WHERE status = 'approved'`
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /users/names error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/users/:id/approve ────────────────────────────────────────────
router.patch("/:id/approve", requireAuth, requireAdminOrChair, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE id = ? AND status = 'pending'", [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Pending user not found." });
    }

    // Approve: set status = 'approved', is_active = 1, keep their role as-is
    const u = rows[0];
    await db.query(
      "UPDATE users SET status = 'approved', is_active = 1, updated_at = NOW() WHERE id = ?",
      [id]
    );
    await writeLog({ userId: req.user.id, action: "USER_APPROVE", detail: `Admin approved account: ${u.full_name} (@${u.username}, ID: ${id})`, ipAddress: req.ip });
    return res.json({ message: "User approved." });
  } catch (err) {
    console.error("PATCH /users/:id/approve error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/users/:id/reject ─────────────────────────────────────────────
router.patch("/:id/reject", requireAuth, requireAdminOrChair, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE id = ? AND status = 'pending'", [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Pending user not found." });
    }

    const ur = rows[0];
    // Reject: set status = 'rejected', keep record in DB for audit trail
    await db.query(
      "UPDATE users SET status = 'rejected', is_active = 0, updated_at = NOW() WHERE id = ?",
      [id]
    );
    await writeLog({ userId: req.user.id, action: "USER_REJECT", detail: `Admin rejected account: ${ur.full_name} (@${ur.username}, ID: ${id})`, ipAddress: req.ip });
    return res.json({ message: "User rejected." });
  } catch (err) {
    console.error("PATCH /users/:id/reject error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/users/:id — fetch a single user ────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== "admin" && req.user.role !== "program_chair" && parseInt(id) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden." });
  }
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, department, username, role, status,
              is_active, avatar_url, created_at
       FROM users WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });
    return res.json({ ...rows[0], ...splitName(rows[0].full_name) });
  } catch (err) {
    console.error("GET /users/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/users/:id — update profile ───────────────────────────────────
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const isAdmin = req.user.role === "admin";
  const isProgramChair = req.user.role === "program_chair";
  const isSelf = String(id) === String(req.user.id);

  // Only admin, program_chair, or the user themselves can update
  if (!isAdmin && !isProgramChair && !isSelf) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const { full_name, first_name, last_name, email, phone, department, avatar_url, role, is_active } = req.body;

  try {
    // Any field not actually present in the request body must fall back to
    // its current DB value, not null/empty — PATCH is a partial update.
    // (An avatar-only PATCH like { avatar_url, avatar_key } previously had
    // email/phone/department/full_name silently nulled/blanked out via
    // `|| null` and the always-recomputed `full_name`, which threw on the
    // NOT NULL `email` column and surfaced as a 500 "Internal server error".)
    const [existingRows] = await db.query(
      "SELECT full_name, email, phone, department, avatar_url, role, is_active FROM users WHERE id = ?",
      [id]
    );
    if (existingRows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    const existing = existingRows[0];

    // full_name is the source of truth (matches the `users.full_name`
    // column). first_name/last_name are accepted too for backwards
    // compatibility with older callers and get combined if full_name
    // itself isn't sent.
    let nextFullName = existing.full_name;
    if (full_name !== undefined) {
      nextFullName = (full_name || "").trim();
    } else if (first_name !== undefined || last_name !== undefined) {
      nextFullName = `${first_name || ""} ${last_name || ""}`.trim();
    }

    const nextEmail      = email       !== undefined ? (email || null)      : existing.email;
    const nextPhone      = phone       !== undefined ? (phone || null)      : existing.phone;
    // department is NOT NULL in the DB — never null it out. If it's being
    // provided but blank, fall back to the org-wide default instead of null.
    const nextDepartment = department  !== undefined ? (department || DEFAULT_DEPARTMENT) : existing.department;
    const nextAvatarUrl  = avatar_url  !== undefined ? (avatar_url || null) : existing.avatar_url;

    // admin and program_chair can additionally change role and is_active,
    // but only when those fields are actually sent in the body.
    // Exception: if the caller is patching their OWN record (e.g. during
    // account setup via an invite JWT), never change the role — the invite
    // flow already set the correct role at INSERT time and finalize-setup
    // preserves it. This prevents the invite JWT's role claim from being
    // misused to escalate/de-escalate the role during self-PATCH.
    if ((isAdmin || isProgramChair) && !isSelf) {
      const nextRole = role !== undefined ? role : existing.role;
      const nextIsActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

      await db.query(
        `UPDATE users 
         SET full_name = ?, email = ?, phone = ?, department = ?, avatar_url = ?,
             role = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [nextFullName, nextEmail, nextPhone, nextDepartment, nextAvatarUrl,
          nextRole, nextIsActive, id]
      );
    } else {
      // self — name/email/phone/department/avatar only
      await db.query(
        `UPDATE users 
         SET full_name = ?, email = ?, phone = ?, department = ?, avatar_url = ?, updated_at = NOW()
         WHERE id = ?`,
        [nextFullName, nextEmail, nextPhone, nextDepartment, nextAvatarUrl, id]
      );
    }

    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, department, username, role, status,
              is_active, avatar_url, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );
    return res.json({ ...rows[0], ...splitName(rows[0].full_name) });
  } catch (err) {
    console.error("PATCH /users/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
// PERMANENT delete. Requires a `mode` in the request body:
//   - "preserve": content this user OWNS is deleted (their comments, their
//     submissions, their tasks). Content they merely ACTED ON but belongs to
//     someone else (a submission they reviewed, a task they assigned, a
//     message addressed to them) is kept — the reference is set to NULL.
//   - "cascade": same as above, but content they acted on is deleted too,
//     even though it may belong to a different user. Use with caution.
//
// Requires the migration in migration_allow_null_for_user_delete.sql to have
// been run first (reviewed_by / receiver_id / assigned_by columns need to
// allow NULL for "preserve" mode).
router.delete("/:id", requireAuth, requireAdminOrChair, async (req, res) => {
  const { id } = req.params;
  const { mode } = req.body || {};

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }
  if (mode !== "cascade" && mode !== "preserve") {
    return res.status(400).json({ message: "mode must be 'cascade' or 'preserve'." });
  }

  let conn;
  try {
    const [rows] = await db.query("SELECT full_name, username FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });
    const target = rows[0];

    conn = await db.getConnection();
    await conn.beginTransaction();

    // ── 1. Content this user OWNS — deleted in both modes ──────────────────
    await conn.query("DELETE FROM document_comments WHERE sender_id = ?", [id]);
    await conn.query("DELETE FROM faculty_score_history WHERE user_id = ?", [id]);
    await conn.query("DELETE FROM form_submissions WHERE submitted_by = ?", [id]);
    await conn.query("DELETE FROM form_templates WHERE created_by = ?", [id]);
    await conn.query("DELETE FROM messages WHERE sender_id = ?", [id]);
    await conn.query("DELETE FROM task_comments WHERE sender_id = ?", [id]);
    await conn.query("DELETE FROM task_changelog WHERE changed_by = ?", [id]);
    await conn.query("DELETE FROM task_assignments WHERE assigned_to = ?", [id]);

    // Tasks this user owns (faculty_id) — their comments must go first,
    // or deleting the task itself will fail with the same FK error.
    const [ownedTasks] = await conn.query("SELECT id FROM tasks WHERE faculty_id = ?", [id]);
    if (ownedTasks.length > 0) {
      const ownedIds = ownedTasks.map(t => t.id);
      await conn.query("DELETE FROM task_comments WHERE task_id IN (?)", [ownedIds]);
      await conn.query("DELETE FROM tasks WHERE faculty_id = ?", [id]);
    }

    // ── 2. Content this user only ACTED ON — mode dependent ────────────────
    if (mode === "cascade") {
      await conn.query("DELETE FROM form_submissions WHERE reviewed_by = ?", [id]);
      await conn.query("DELETE FROM messages WHERE receiver_id = ?", [id]);
      await conn.query("DELETE FROM task_assignments WHERE assigned_by = ?", [id]);

      const [assignedTasks] = await conn.query("SELECT id FROM tasks WHERE assigned_by = ?", [id]);
      if (assignedTasks.length > 0) {
        const assignedIds = assignedTasks.map(t => t.id);
        await conn.query("DELETE FROM task_comments WHERE task_id IN (?)", [assignedIds]);
        await conn.query("DELETE FROM tasks WHERE assigned_by = ?", [id]);
      }
    } else {
      // preserve — clear the reference, keep the other user's record intact
      await conn.query("UPDATE form_submissions SET reviewed_by = NULL WHERE reviewed_by = ?", [id]);
      await conn.query("UPDATE messages SET receiver_id = NULL WHERE receiver_id = ?", [id]);
      await conn.query("UPDATE task_assignments SET assigned_by = NULL WHERE assigned_by = ?", [id]);
      await conn.query("UPDATE tasks SET assigned_by = NULL WHERE assigned_by = ?", [id]);
      await conn.query("UPDATE task_changelog SET changed_by = NULL WHERE changed_by = ?", [id]);
    }

    // ── 3. Finally, the user row itself ─────────────────────────────────────
    await conn.query("DELETE FROM users WHERE id = ?", [id]);

    await conn.commit();

    await writeLog({
      userId: req.user.id,
      action: "USER_DELETE",
      detail: `Admin permanently deleted user account: ${target.full_name} (@${target.username}, ID: ${id}) — mode: ${mode}`,
      ipAddress: req.ip,
    });

    return res.json({ message: "User permanently deleted." });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch { } }
    console.error("DELETE /users/:id error:", err);
    return res.status(500).json({ message: err.message || "Internal server error." });
  } finally {
    if (conn) conn.release();
  }
});

// ─── POST /api/users/:id/change-password ──────────────────────────────────────
// Allows a user to change their own password (or an admin to change anyone's).
router.post("/:id/change-password", requireAuth, async (req, res) => {
  const { id } = req.params;
  const isSelf  = parseInt(id) === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const { current_password, new_password } = req.body;

  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters." });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "User not found." });

    const user = rows[0];

    // Self-changes require the current password; admins can skip this check.
    if (isSelf) {
      if (!current_password) {
        return res.status(400).json({ message: "Current password is required." });
      }
      const match = await bcrypt.compare(current_password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?", [hashed, id]);
    await writeLog({
      userId: req.user.id,
      action: "USER_PASSWORD_CHANGE",
      detail: `Password changed for user ID ${id} (${user.username})`,
      ipAddress: req.ip,
    });

    return res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("POST /users/:id/change-password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/users/:id/preferences ──────────────────────────────────────────
router.get("/:id/preferences", requireAuth, async (req, res) => {
  const { id } = req.params;
  const isSelf = parseInt(id) === req.user.id;
  const isAdmin = req.user.role === "admin" || req.user.role === "program_chair";
  if (!isSelf && !isAdmin) return res.status(403).json({ message: "Forbidden." });
  try {
    const [rows] = await db.query("SELECT preferences FROM users WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "User not found." });
    let prefs = { email: true, inapp: true, approval: true, docUpdates: true };
    try { if (rows[0].preferences) prefs = { ...prefs, ...JSON.parse(rows[0].preferences) }; } catch {}
    return res.json(prefs);
  } catch (err) {
    console.error("GET /users/:id/preferences error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/users/:id/preferences ────────────────────────────────────────
router.patch("/:id/preferences", requireAuth, async (req, res) => {
  const { id } = req.params;
  const isSelf = parseInt(id) === req.user.id;
  const isAdmin = req.user.role === "admin" || req.user.role === "program_chair";
  if (!isSelf && !isAdmin) return res.status(403).json({ message: "Forbidden." });
  try {
    // Merge with existing preferences so a partial update never wipes other keys
    const [rows] = await db.query("SELECT preferences FROM users WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "User not found." });
    let existing = { email: true, inapp: true, approval: true, docUpdates: true };
    try { if (rows[0].preferences) existing = { ...existing, ...JSON.parse(rows[0].preferences) }; } catch {}
    const merged = { ...existing, ...req.body };
    await db.query("UPDATE users SET preferences = ?, updated_at = NOW() WHERE id = ?", [JSON.stringify(merged), id]);
    return res.json(merged);
  } catch (err) {
    console.error("PATCH /users/:id/preferences error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/users/:id/finalize-setup ───────────────────────────────────────
// Called when a draft user completes the account setup form.
// - If the user has a valid (non-expired) invite_token: auto-approve immediately,
//   clear the token, and issue a fresh JWT so they can log straight in.
// - Otherwise (regular OAuth self-registration): upgrade draft → pending so
//   admin can review and approve normally.
router.post("/:id/finalize-setup", requireAuth, async (req, res) => {
  const { id } = req.params;
  const isSelf = String(id) === String(req.user.id);
  if (!isSelf) return res.status(403).json({ message: "Forbidden." });

  try {
    const [rows] = await db.query(
      "SELECT status, invite_token, invite_token_expires FROM users WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found." });

    const user = rows[0];

    // Invited user — auto-approve, no queue
    const hasValidInvite =
      user.invite_token &&
      user.invite_token_expires &&
      new Date(user.invite_token_expires) > new Date();

    if ((user.status === "draft" || user.status === "pending") && hasValidInvite) {
      await db.query(
        `UPDATE users
         SET status = 'approved', is_active = 1,
             invite_token = NULL, invite_token_expires = NULL,
             updated_at = NOW()
         WHERE id = ?`,
        [id]
      );

      // Re-fetch the updated user so we can issue a proper JWT
      const [updated] = await db.query(
        "SELECT id, username, role, full_name FROM users WHERE id = ?",
        [id]
      );
      const u = updated[0];
      const jwt = require("jsonwebtoken");
      const newToken = jwt.sign(
        { id: u.id, username: u.username, role: u.role, full_name: u.full_name },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      await writeLog({
        userId:    parseInt(id),
        action:    "USER_INVITE_COMPLETE",
        detail:    `Invited user completed setup and was auto-approved (ID: ${id})`,
        ipAddress: req.ip,
      });

      return res.json({ message: "Account activated.", autoApproved: true, token: newToken });
    }

    // Regular OAuth draft — upgrade to pending for admin review
    if (user.status === "draft") {
      await db.query(
        "UPDATE users SET status = 'pending', updated_at = NOW() WHERE id = ?",
        [id]
      );
    }

    return res.json({ message: "Account submitted for approval.", autoApproved: false });
  } catch (err) {
    console.error("POST /users/:id/finalize-setup error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/users/:id/set-credentials ──────────────────────────────────────
// Used by invited users to set their username and password after completing
// account setup. Only the user themselves may call this, and only while their
// account is already approved (finalize-setup ran first).
router.post("/:id/set-credentials", requireAuth, async (req, res) => {
  const { id } = req.params;
  const isSelf = String(id) === String(req.user.id);
  if (!isSelf) return res.status(403).json({ message: "Forbidden." });

  const { username, password } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ message: "Username is required." });
  }
  if (!/^[a-z0-9_]+$/.test(username.trim())) {
    return res.status(400).json({ message: "Username may only contain lowercase letters, numbers, and underscores." });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  try {
    // Check username isn't already taken by another user
    const [conflict] = await db.query(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username.trim(), id]
    );
    if (conflict.length > 0) {
      return res.status(409).json({ message: "That username is already taken." });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET username = ?, password = ?, updated_at = NOW() WHERE id = ?",
      [username.trim(), hashed, id]
    );

    // Re-issue JWT with the real username now set
    const [rows] = await db.query(
      "SELECT id, username, role, full_name FROM users WHERE id = ?",
      [id]
    );
    const u = rows[0];
    const newToken = jwt.sign(
      { id: u.id, username: u.username, role: u.role, full_name: u.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await writeLog({
      userId:    parseInt(id),
      action:    "USER_SET_CREDENTIALS",
      detail:    `User set username and password after invite setup (username: ${username.trim()})`,
      ipAddress: req.ip,
    });

    return res.json({ message: "Credentials set successfully.", token: newToken });
  } catch (err) {
    console.error("POST /users/:id/set-credentials error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;