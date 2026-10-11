/**
 * facultyScoreService.js
 *
 * Computes a performance score per faculty member from three sources
 * the department tracks (tasks - both solo and collaborative, form_submissions) 
 * and writes the result back onto `users`.
 *
 * Table/column names used below:
 *   tasks:                faculty_id, status, deadline, is_collaborative
 *   task_collaborators:   user_id, task_id (links users to collaborative tasks)
 *   form_submissions:     submitted_by, status (no deadline column — forms
 *                         never count as overdue, only pending/active)
 *
 * Scoring formula:
 *   Every faculty member starts at 100%.
 *   - Each item that's overdue (past deadline): −5 points
 *   - Active/pending items that are NOT overdue: no deduction
 *   score = clamp(100 − (overdue × 5), 0, 100)
 *
 * Completed items don't add points back — they simply don't cost any.
 * A faculty member with nothing outstanding stays at 100%.
 * Faculty working on tasks within their deadline also stays at 100%.
 *
 * "done" statuses: approved, rejected, archived, completed, registered
 * (mirrors the `done` logic already used in Dashboard.jsx's fetchTrackedItems)
 */

const DONE_STATUSES = ["approved", "rejected", "archived", "completed", "registered"];
const ACTIVE_STATUSES = ["for approval", "returned for revision", "under review", "in progress", "return for revision"];
const PENDING_STATUS = "pending";

// Only overdue items affect the score
const OVERDUE_PENALTY = 5;  // points lost per item past its deadline

/**
 * Builds one UNION ALL query across tasks / collaborative tasks / form_submissions.
 * Each branch must return: (user_id, is_done, is_active, is_pending, is_overdue)
 */
function buildSourceQuery() {
  return `
    SELECT t.faculty_id AS user_id,
           LOWER(t.status) IN (${DONE_STATUSES.map(() => "?").join(",")}) AS is_done,
           LOWER(t.status) IN (${ACTIVE_STATUSES.map(() => "?").join(",")}) AS is_active,
           LOWER(t.status) = ? AS is_pending,
           (t.deadline IS NOT NULL AND t.deadline < NOW() AND LOWER(t.status) NOT IN (${DONE_STATUSES.map(() => "?").join(",")})) AS is_overdue
      FROM tasks t
      JOIN users u ON u.id = t.faculty_id
     WHERE t.faculty_id IS NOT NULL
       AND t.is_collaborative = 0
       AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1

    UNION ALL

    SELECT tc.user_id AS user_id,
           LOWER(t.status) IN (${DONE_STATUSES.map(() => "?").join(",")}) AS is_done,
           LOWER(t.status) IN (${ACTIVE_STATUSES.map(() => "?").join(",")}) AS is_active,
           LOWER(t.status) = ? AS is_pending,
           (t.deadline IS NOT NULL AND t.deadline < NOW() AND LOWER(t.status) NOT IN (${DONE_STATUSES.map(() => "?").join(",")})) AS is_overdue
      FROM task_collaborators tc
      JOIN tasks t ON t.id = tc.task_id
      JOIN users u ON u.id = tc.user_id
     WHERE tc.user_id IS NOT NULL
       AND t.is_collaborative = 1
       AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1

    UNION ALL

    SELECT fs.submitted_by AS user_id,
           LOWER(fs.status) IN (${DONE_STATUSES.map(() => "?").join(",")}) AS is_done,
           LOWER(fs.status) IN (${ACTIVE_STATUSES.map(() => "?").join(",")}) AS is_active,
           LOWER(fs.status) = ? AS is_pending,
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

function computeScore({ active, overdue }) {
  // Only overdue tasks affect the score - active work within deadline is fine
  const score = 100 - (overdue * OVERDUE_PENALTY);
  return Math.round(clamp(score, 0, 100));
}

/**
 * Returns the actual list of overdue tasks — one row per delayed document,
 * with the faculty member's name attached — for a "delayed by faculty" table.
 * Includes both regular tasks and collaborative tasks.
 * Only tasks have deadlines, so form_submissions are not included here.
 *
 * @param {import('mysql2/promise').Pool} pool
 */
async function getDelayedDocuments(pool) {
  const [rows] = await pool.query(
    `SELECT t.id,
            t.title,
            t.doc_type,
            t.priority,
            t.deadline,
            t.status,
            t.faculty_id,
            u.full_name AS faculty_name,
            DATEDIFF(CURDATE(), t.deadline) AS days_overdue,
            FALSE AS is_collaborative
       FROM tasks t
       JOIN users u ON u.id = t.faculty_id
      WHERE t.deadline IS NOT NULL
        AND t.deadline < NOW()
        AND t.is_collaborative = 0
        AND LOWER(t.status) NOT IN (${DONE_STATUSES.map(() => "?").join(",")})
        AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1

    UNION ALL

    SELECT t.id,
            t.title,
            t.doc_type,
            t.priority,
            t.deadline,
            t.status,
            tc.user_id AS faculty_id,
            u.full_name AS faculty_name,
            DATEDIFF(CURDATE(), t.deadline) AS days_overdue,
            TRUE AS is_collaborative
       FROM tasks t
       JOIN task_collaborators tc ON tc.task_id = t.id
       JOIN users u ON u.id = tc.user_id
      WHERE t.deadline IS NOT NULL
        AND t.deadline < NOW()
        AND t.is_collaborative = 1
        AND LOWER(t.status) NOT IN (${DONE_STATUSES.map(() => "?").join(",")})
        AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1

      ORDER BY deadline ASC`,
    [...DONE_STATUSES, ...DONE_STATUSES]
  );
  return rows;
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
  // solo tasks: is_done, is_active, is_pending, is_overdue(NOT IN)
  // collaborative tasks: is_done, is_active, is_pending, is_overdue(NOT IN)
  // form_submissions: is_done, is_active, is_pending
  const params = [
    ...DONE_STATUSES,    // tasks.is_done
    ...ACTIVE_STATUSES,  // tasks.is_active
    PENDING_STATUS,      // tasks.is_pending
    ...DONE_STATUSES,    // tasks.is_overdue NOT IN
    ...DONE_STATUSES,    // collaborative_tasks.is_done
    ...ACTIVE_STATUSES,  // collaborative_tasks.is_active
    PENDING_STATUS,      // collaborative_tasks.is_pending
    ...DONE_STATUSES,    // collaborative_tasks.is_overdue NOT IN
    ...DONE_STATUSES,    // form_submissions.is_done
    ...ACTIVE_STATUSES,  // form_submissions.is_active
    PENDING_STATUS,      // form_submissions.is_pending
  ];

  const [rows] = await pool.query(
    `SELECT user_id,
            SUM(is_active = 1)                  AS active_count,
            SUM(is_done = 1)                    AS completed_count,
            SUM(is_pending = 1)                 AS pending_count,
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
    const score = computeScore({ active, overdue });
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

module.exports = { recalculateAllScores, computeScore, getDelayedDocuments, DONE_STATUSES, ACTIVE_STATUSES, PENDING_STATUS };