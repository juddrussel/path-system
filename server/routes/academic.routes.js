// routes/academic.routes.js — CRUD for academic_periods (semestral config)
const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized." });
  try { req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Invalid or expired token." }); }
}
function requireAdminOrChair(req, res, next) {
  if (!["admin", "program_chair"].includes(req.user?.role))
    return res.status(403).json({ message: "Admin or Program Chair access required." });
  next();
}

// ── GET /api/academic  — list all periods (any auth) ─────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM academic_periods ORDER BY academic_year DESC, FIELD(semester,'1st Semester','2nd Semester','Summer')"
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /academic error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ── GET /api/academic/active — active period (any auth) ───────────────────────
router.get("/active", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM academic_periods WHERE is_active = 1 LIMIT 1"
    );
    return res.json(rows[0] || null);
  } catch (err) {
    console.error("GET /academic/active error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ── POST /api/academic — create a period (admin/chair) ────────────────────────
router.post("/", requireAuth, requireAdminOrChair, async (req, res) => {
  const { name, semester, academic_year, start_date, end_date, is_active } = req.body;
  if (!name || !semester || !academic_year || !start_date || !end_date)
    return res.status(400).json({ message: "name, semester, academic_year, start_date, and end_date are required." });
  try {
    // If setting active, deactivate all others first
    if (is_active) await db.query("UPDATE academic_periods SET is_active = 0");
    const [result] = await db.query(
      `INSERT INTO academic_periods (name, semester, academic_year, start_date, end_date, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, semester, academic_year, start_date, end_date, is_active ? 1 : 0, req.user.id]
    );
    const [rows] = await db.query("SELECT * FROM academic_periods WHERE id = ?", [result.insertId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /academic error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ── PATCH /api/academic/:id — update a period (admin/chair) ───────────────────
router.patch("/:id", requireAuth, requireAdminOrChair, async (req, res) => {
  const { id } = req.params;
  const { name, semester, academic_year, start_date, end_date, is_active } = req.body;
  try {
    const [existing] = await db.query("SELECT * FROM academic_periods WHERE id = ?", [id]);
    if (!existing.length) return res.status(404).json({ message: "Period not found." });
    const p = existing[0];
    if (is_active) await db.query("UPDATE academic_periods SET is_active = 0");
    await db.query(
      `UPDATE academic_periods SET
         name = ?, semester = ?, academic_year = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name          ?? p.name,
        semester      ?? p.semester,
        academic_year ?? p.academic_year,
        start_date    ?? p.start_date,
        end_date      ?? p.end_date,
        is_active !== undefined ? (is_active ? 1 : 0) : p.is_active,
        id,
      ]
    );
    const [rows] = await db.query("SELECT * FROM academic_periods WHERE id = ?", [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error("PATCH /academic/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ── DELETE /api/academic/:id — delete a period (admin/chair) ──────────────────
router.delete("/:id", requireAuth, requireAdminOrChair, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id FROM academic_periods WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Period not found." });
    await db.query("DELETE FROM academic_periods WHERE id = ?", [req.params.id]);
    return res.json({ message: "Period deleted." });
  } catch (err) {
    console.error("DELETE /academic/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
