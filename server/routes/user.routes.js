// routes/user.routes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { writeLog } = require("./audit.routes");

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
              is_active, created_at, updated_at
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
  const { first_name, last_name, username, email, role, password, is_active, department } = req.body;

  if (!first_name || !username || !password || !role) {
    return res.status(400).json({ message: "first_name, username, password, and role are required." });
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

    // Admin-created users are automatically approved
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, phone, department, username, password, role, status, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW())`,
      [full_name, email || null, null, department || null, username, hashed, role, active]
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
      `SELECT id, full_name, email, phone, department, username, role, status, created_at
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
              is_active, updated_at AS resolved_on
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
// ─── PATCH /api/users/:id — update profile ───────────────────────────────────
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const isAdmin = req.user.role === "admin";
  const isProgramChair = req.user.role === "program_chair";
  const isSelf = parseInt(id) === req.user.id;

  // Only admin, program_chair, or the user themselves can update
  if (!isAdmin && !isProgramChair && !isSelf) {
    return res.status(403).json({ message: "Forbidden." });
  }

  const { first_name, last_name, email, phone, department, avatar_url, role, is_active } = req.body;
  const full_name = `${first_name || ""} ${last_name || ""}`.trim();

  try {
    // admin and program_chair can change role and is_active
    if (isAdmin || isProgramChair) {
      await db.query(
        `UPDATE users 
         SET full_name = ?, email = ?, phone = ?, department = ?, avatar_url = ?,
             role = ?, is_active = ?, updated_at = NOW()
         WHERE id = ?`,
        [full_name, email || null, phone || null, department || null, avatar_url || null,
          role || null, is_active !== undefined ? (is_active ? 1 : 0) : null, id]
      );
    } else {
      // self — name/email/phone/department only
      await db.query(
        `UPDATE users 
         SET full_name = ?, email = ?, phone = ?, department = ?, avatar_url = ?, updated_at = NOW()
         WHERE id = ?`,
        [full_name, email || null, phone || null, department || null, avatar_url || null, id]
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
router.delete("/:id", requireAuth, requireAdminOrChair, async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }
  try {
    const [rows] = await db.query("SELECT id FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });

    const [[toDelete]] = await db.query("SELECT full_name, username FROM users WHERE id = ?", [id]);
    try { await db.query("UPDATE audit_log SET user_id = NULL WHERE user_id = ?", [id]); } catch { }
    try { await db.query("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?", [id, id]); } catch { }
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    await writeLog({ userId: req.user.id, action: "USER_DELETE", detail: `Admin deleted user account: ${toDelete?.full_name} (ID: ${id})`, ipAddress: req.ip });
    return res.json({ message: "User deleted." });
  } catch (err) {
    console.error("DELETE /users/:id error:", err);
    return res.status(500).json({ message: err.message || "Internal server error." });
  }
});

module.exports = router;  