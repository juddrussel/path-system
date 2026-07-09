/**
 * facultyRoutes.js
 *
 * Wire this into your existing Express app, e.g.:
 *   const facultyRoutes = require('./routes/facultyRoutes');
 *   app.use('/api/faculty', facultyRoutes(pool));
 *
 * Assumes you already have `authenticateJWT` and `requireRole` middleware
 * (adjust the import paths to match your project). If your auth middleware
 * has different names/signatures, just swap them in.
 */

const express = require("express");
const { recalculateAllScores } = require("../services/facultyScoreService");

// ⚠️ adjust these imports to match your actual auth middleware
const { authenticateJWT, requireRole } = require("../middleware/auth");

module.exports = function facultyRoutes(pool) {
  const router = express.Router();

  // GET /api/faculty/performance
  // Returns faculty users with their stored (already-computed) scores.
  // This is what the dashboard's Faculty Performance Summary should call.
  router.get("/performance", authenticateJWT, async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, full_name, active_count, completed_count, pending_count,
                overdue_count, performance_score, score_updated_at
           FROM users
          WHERE role = 'faculty'
          ORDER BY performance_score DESC`
      );
      res.json({ faculty: rows });
    } catch (err) {
      console.error("Faculty performance fetch error:", err);
      res.status(500).json({ error: "Failed to load faculty performance" });
    }
  });

  // POST /api/faculty/recalculate-scores
  // Admin/program-chair triggered recalculation (also called by the nightly cron).
  router.post(
    "/recalculate-scores",
    authenticateJWT,
    requireRole(["admin", "program_chair"]),
    async (req, res) => {
      try {
        const result = await recalculateAllScores(pool, { keepHistory: true });
        res.json({ ok: true, ...result });
      } catch (err) {
        console.error("Score recalculation error:", err);
        res.status(500).json({ error: "Failed to recalculate scores" });
      }
    }
  );

  return router;
};
