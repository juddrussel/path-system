// routes/audit.routes.js
const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized." });
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireAdmin(req, res, next) {
  if (!["admin", "program_chair"].includes(req.user?.role))
    return res.status(403).json({ message: "Admin access required." });
  next();
}

// ─── HELPER: write an audit log entry ────────────────────────────────────────
async function writeLog({ userId, action, detail, ipAddress, documentId }) {
  try {
    await db.query(
      `INSERT INTO audit_log (user_id, action, detail, ip_address, document_id, timestamp)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId || null, action || "UNKNOWN", detail || null, ipAddress || null, documentId || null]
    );
  } catch (err) {
    console.error("Audit writeLog error:", err.message);
  }
}

// ─── POST /api/audit/log — frontend-triggered audit entry ────────────────────
router.post("/log", requireAuth, async (req, res) => {
  const { action, detail } = req.body;
  if (!action) return res.status(400).json({ message: "action is required." });
  try {
    await writeLog({
      userId:    req.user.id,
      action,
      detail:    detail || null,
      ipAddress: req.ip,
    });
    return res.status(201).json({ message: "Logged." });
  } catch (err) {
    console.error("POST /api/audit/log error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/audit — paginated audit log with filters ───────────────────────
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      q       = "",
      action  = "",
      user_id = "",
      date    = "",
      page    = 1,
      limit   = 20,
    } = req.query;

    const conditions = [];
    const params     = [];

    if (q) {
      conditions.push("(al.detail LIKE ? OR al.action LIKE ? OR u.full_name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (action)  { conditions.push("al.action = ?");           params.push(action); }
    if (user_id) { conditions.push("al.user_id = ?");          params.push(user_id); }
    if (date)    { conditions.push("DATE(al.timestamp) = ?");   params.push(date); }

    const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await db.query(
      `SELECT
         al.id,
         al.action,
         al.detail,
         al.ip_address,
         al.timestamp,
         al.user_id,
         al.document_id,
         u.full_name  AS user_name,
         u.username,
         u.role       AS user_role,
         u.avatar_url AS user_avatar_url
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.timestamp DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}`,
      params
    );

    const logs = rows.map(r => {
      const nameParts = (r.user_name || "").trim().split(/\s+/);
      return {
        ...r,
        user: {
          id:         r.user_id,
          full_name:  r.user_name,
          username:   r.username,
          role:       r.user_role,
          avatar_url: r.user_avatar_url || null,
          first_name: nameParts[0] || "",
          last_name:  nameParts.slice(1).join(" ") || "",
        },
      };
    });
    return res.json({
      logs,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("GET /api/audit error:", err);
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
});

// ─── GET /api/audit/stats ─────────────────────────────────────────────────────
router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [[{ total }]]        = await db.query("SELECT COUNT(*) AS total FROM audit_log");
    const [[{ today }]]        = await db.query("SELECT COUNT(*) AS today FROM audit_log WHERE DATE(timestamp) = CURDATE()");
    const [[{ this_week }]]    = await db.query("SELECT COUNT(*) AS this_week FROM audit_log WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    const [[{ this_month }]]   = await db.query("SELECT COUNT(*) AS this_month FROM audit_log WHERE MONTH(timestamp) = MONTH(NOW()) AND YEAR(timestamp) = YEAR(NOW())");
    const [[{ unique_users }]] = await db.query("SELECT COUNT(DISTINCT user_id) AS unique_users FROM audit_log WHERE user_id IS NOT NULL");

    const [topActions] = await db.query(
      `SELECT action, COUNT(*) AS count
       FROM audit_log
       WHERE DATE(timestamp) = CURDATE()
       GROUP BY action
       ORDER BY count DESC
       LIMIT 1`
    );

    return res.json({
      total,
      today,
      this_week,
      this_month,
      unique_users,
      top_action_today: topActions[0]?.action || null,
    });
  } catch (err) {
    console.error("GET /api/audit/stats error:", err);
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
});

// ─── GET /api/audit/actions — distinct action types for filter dropdown ───────
router.get("/actions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DISTINCT action FROM audit_log ORDER BY action ASC"
    );
    return res.json(rows.map(r => r.action));
  } catch (err) {
    console.error("GET /api/audit/actions error:", err);
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
});

// ─── GET /api/audit/:id — single log entry ───────────────────────────────────
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT al.*, u.full_name AS user_name, u.username, u.role AS user_role
       FROM audit_log al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Log entry not found." });
    return res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/audit/:id error:", err);
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
});

module.exports = { router, writeLog };