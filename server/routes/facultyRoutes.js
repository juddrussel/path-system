/**
 * facultyRoutes.js
 *
 * Wire this into your existing Express app, e.g.:
 *   const facultyRoutes = require('./routes/facultyRoutes');
 *   app.use('/api/faculty', facultyRoutes(pool));
 */

const express = require("express");
const { recalculateAllScores, getDelayedDocuments } = require("../services/facultyScoreService");
const { requireAuth, requireRole } = require("../middleware/auth");

module.exports = function facultyRoutes(pool) {
  const router = express.Router();

  // GET /api/faculty/performance
  // Returns faculty users with their stored (already-computed) scores.
  // This is what the dashboard's Faculty Performance Summary should call.
  router.get("/performance", requireAuth, async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, full_name, active_count, completed_count, pending_count,
                overdue_count, performance_score, score_updated_at
           FROM users
          WHERE role = 'faculty'
            AND status = 'approved'
            AND is_active = 1
          ORDER BY performance_score DESC`
      );
      res.json({ faculty: rows });
    } catch (err) {
      console.error("Faculty performance fetch error:", err);
      res.status(500).json({ error: "Failed to load faculty performance" });
    }
  });

  // GET /api/faculty/delayed-documents
  // Returns the actual overdue tasks, one row per document, with the
  // responsible faculty member's name attached.
  router.get("/delayed-documents", requireAuth, async (req, res) => {
    try {
      const rows = await getDelayedDocuments(pool);
      res.json({ delayed: rows });
    } catch (err) {
      console.error("Delayed documents fetch error:", err);
      res.status(500).json({ error: "Failed to load delayed documents" });
    }
  });

  // POST /api/faculty/recalculate-scores
  // Admin/program-chair triggered recalculation (also called by the nightly cron).
  router.post(
    "/recalculate-scores",
    requireAuth,
    requireRole("admin", "program_chair"),
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