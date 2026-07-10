/**
 * facultyScoreService.js
 *
 * Computes a performance score per faculty member from the two sources
 * the department tracks (tasks, form_submissions) and writes the result
 * back onto `users`.
 *
 * Table/column names used below (confirmed from DESCRIBE output):
 *   tasks:            faculty_id, status, deadline
 *   form_submissions: submitted_by, status (no deadline column — forms
 *                      never count as overdue, only pending/active)
 *
 * Scoring formula (feel free to tune the weights):
 *   base_rate   = completed / (completed + pending)          -> 0–100
 *   overdue_hit = 4 points off per overdue item, capped at 40
 *   score       = clamp(base_rate - overdue_hit, 0, 100)
 *
 * "done" statuses: approved, rejected, archived, completed, registered, received
 * (mirrors the `done` logic already used in Dashboard.jsx's fetchTrackedItems)
 */

const DONE_STATUSES = ["approved", "rejected", "archived", "completed", "registered", "received"];

/**
 * Builds one UNION ALL query across tasks / form_submissions.
 * Each branch must return: (user_id, is_done, is_overdue)
 */
function buildSourceQuery() {
  return `
    SELECT t.faculty_id AS user_id,
           LOWER(t.status) IN (${DONE_STATUSES.map(() => "?").join(",")}) AS is_done,
           (t.deadline IS NOT NULL AND t.deadline < NOW() AND LOWER(t.status) NOT IN (${DONE_STATUSES.map(() => "?").join(",")})) AS is_overdue
      FROM tasks t
      JOIN users u ON u.id = t.faculty_id
     WHERE t.faculty_id IS NOT NULL
       AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1

    UNION ALL

    SELECT fs.submitted_by AS user_id,
           LOWER(fs.status) IN (${DONE_STATUSES.map(() => "?").join(",")}) AS is_done,
           FALSE AS is_overdue
      FROM form_submissions fs
      JOIN users u ON u.id = fs.submitted_by
     WHERE fs.submitted_by IS NOT NULL
       AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1
  `;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computeScore({ completed, pending, overdue }) {
  const denom = completed + pending;
  const baseRate = denom > 0 ? (completed / denom) * 100 : 100; // no items yet -> neutral 100
  const overduePenalty = Math.min(overdue * 4, 40);
  return Math.round(clamp(baseRate - overduePenalty, 0, 100));
}

/**
 * Recalculates scores for every faculty user and writes them back to `users`.
 * Optionally also inserts a snapshot row into `faculty_score_history`.
 *
 * @param {import('mysql2/promise').Pool} pool
 * @param {{ keepHistory?: boolean }} opts
 */
async function recalculateAllScores(pool, opts = {}) {
  const { keepHistory = true } = opts;

  // Placeholder order must match buildSourceQuery()'s `?` occurrences exactly:
  // tasks.is_done, tasks.is_overdue(NOT IN), form_submissions.is_done
  const params = [
    ...DONE_STATUSES,
    ...DONE_STATUSES,
    ...DONE_STATUSES,
  ];

  const [rows] = await pool.query(
    `SELECT user_id,
            SUM(is_done = 0 AND is_overdue = 0) AS active_count,
            SUM(is_done = 1)                    AS completed_count,
            SUM(is_done = 0)                    AS pending_count,
            SUM(is_overdue = 1)                 AS overdue_count
       FROM (${buildSourceQuery()}) AS combined
      GROUP BY user_id`,
    params
  );

  if (rows.length === 0) return { updated: 0 };

  const now = new Date();
  const updates = rows.map(r => {
    const completed = Number(r.completed_count) || 0;
    const pending = Number(r.pending_count) || 0;
    const overdue = Number(r.overdue_count) || 0;
    const active = Number(r.active_count) || 0;
    const score = computeScore({ completed, pending, overdue });
    return { userId: r.user_id, active, completed, pending, overdue, score };
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const u of updates) {
      await conn.query(
        `UPDATE users
            SET performance_score = ?,
                active_count = ?,
                completed_count = ?,
                pending_count = ?,
                overdue_count = ?,
                score_updated_at = ?
          WHERE id = ?`,
        [u.score, u.active, u.completed, u.pending, u.overdue, now, u.userId]
      );

      if (keepHistory) {
        await conn.query(
          `INSERT INTO faculty_score_history
             (user_id, performance_score, active_count, completed_count, pending_count, overdue_count, recorded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [u.userId, u.score, u.active, u.completed, u.pending, u.overdue, now]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return { updated: updates.length, updatedAt: now };
}

module.exports = { recalculateAllScores, computeScore, DONE_STATUSES };