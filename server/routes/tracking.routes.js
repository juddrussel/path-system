// routes/tracking.routes.js
// Serves form_submissions as "tracked documents" for the Tracking page,
// Dashboard, and Reports. Returns { documents: [...] }.
const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");

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

// GET /api/tracking
// Admin/program_chair: all submissions
// Faculty: only their own submissions
router.get("/", requireAuth, async (req, res) => {
  try {
    const isReviewer = ["admin", "program_chair"].includes(req.user.role);

    let rows;
    if (isReviewer) {
      [rows] = await db.query(
        `SELECT
           fs.id,
           fs.tracking_id,
           fs.category        AS document_type,
           fs.category        AS title,
           fs.status,
           fs.filing_date     AS submitted_at,
           fs.created_at,
           fs.updated_at,
           fs.review_note,
           fs.reviewed_at,
           fs.file_url,
           fs.file_name,
           u.full_name        AS submitted_by_name,
           u.id               AS submitted_by,
           r.full_name        AS reviewer_name,
           u.department
         FROM form_submissions fs
         LEFT JOIN users u ON u.id = fs.submitted_by
         LEFT JOIN users r ON r.id = fs.reviewed_by
         ORDER BY fs.created_at DESC`
      );
    } else {
      [rows] = await db.query(
        `SELECT
           fs.id,
           fs.tracking_id,
           fs.category        AS document_type,
           fs.category        AS title,
           fs.status,
           fs.filing_date     AS submitted_at,
           fs.created_at,
           fs.updated_at,
           fs.review_note,
           fs.reviewed_at,
           fs.file_url,
           fs.file_name,
           u.full_name        AS submitted_by_name,
           u.id               AS submitted_by,
           r.full_name        AS reviewer_name,
           u.department
         FROM form_submissions fs
         LEFT JOIN users u ON u.id = fs.submitted_by
         LEFT JOIN users r ON r.id = fs.reviewed_by
         WHERE fs.submitted_by = ?
         ORDER BY fs.created_at DESC`,
        [req.user.id]
      );
    }

    return res.json({ documents: rows });
  } catch (err) {
    console.error("GET /tracking error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
