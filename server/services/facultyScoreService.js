/**
 * facultyScoreService.js
 *
 * Computes a performance score per faculty member from three sources
 * the department tracks (tasks, collaborative_tasks, form_submissions) 
 * and writes the result back onto `users`.
 *
 * Table/column names used below:
 *   tasks:                faculty_id, status, deadline
 *   collaborative_tasks:  status, deadline (linked via task_collaborators)
 *   task_collaborators:   user_id, task_id
 *   form_submissions:     submitted_by, status (no deadline column — forms
 *                         never count as overdue, only pending/active)
 *
 * Scoring formula (feel free to tune the weights):
 *   Every faculty member starts at 100%.
 *   - Each item still active/pending (not overdue): −1 point
 *   - Each item that's overdue:                     −5 points
 *   score = clamp(100 − (active × 1) − (overdue × 5), 0, 100)
 *
 * Completed items don't add points back — they simply don't cost any.
 * A faculty member with nothing outstanding stays at 100%.
 *
 * "done" statuses: approved, rejected, archived, completed, registered, received
 * (mirrors the `done` logic already used in Dashboard.jsx's fetchTrackedItems)
 */

const DONE_STATUSES = ["approved", "rejected", "archived", "completed", "registered", "received"];
const ACTIVE_STATUSES = ["for approval", "returned for revision", "under review", "in progress", "return for revision"];
const PENDING_STATUS = "pending";

// Tune these to change how harshly outstanding work affects the score.
const ACTIVE_PENALTY = 1;   // points lost per item still in progress, on time
const OVERDUE_PENALTY = 5;  // points lost per item past its deadline

/**
 * Builds one UNION ALL query across tasks / collaborative_tasks / form_submissions.
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
       AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1

    UNION ALL

    SELECT tc.user_id AS user_id,
           LOWER(ct.status) IN (${DONE_STATUSES.map(() => "?").join(",")}) AS is_done,
           LOWER(ct.status) IN (${ACTIVE_STATUSES.map(() => "?").join(",")}) AS is_active,
           LOWER(ct.status) = ? AS is_pending,
           (ct.deadline IS NOT NULL AND ct.deadline < NOW() AND LOWER(ct.status) NOT IN (${DONE_STATUSES.map(() => "?").join(",")})) AS is_overdue
      FROM task_collaborators tc
      JOIN collaborative_tasks ct ON ct.id = tc.task_id
      JOIN users u ON u.id = tc.user_id
     WHERE tc.user_id IS NOT NULL
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
  const score = 100 - (active * ACTIVE_PENALTY) - (overdue * OVERDUE_PENALTY);
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
  try {
    // Check if collaborative_tasks table exists first
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'collaborative_tasks'
    `);
    
    const hasCollaborativeTasks = tables.length > 0;
    
    // Build query parameters
    const params = [...DONE_STATUSES];
    if (hasCollaborativeTasks) {
      params.push(...DONE_STATUSES);
    }
    
    // Build query based on available tables
    let query = `
      SELECT t.id,
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
          AND LOWER(t.status) NOT IN (${DONE_STATUSES.map(() => "?").join(",")})
          AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1
    `;
    
    // Add collaborative tasks if table exists
    if (hasCollaborativeTasks) {
      query += `
      UNION ALL

      SELECT ct.id,
              ct.title,
              ct.doc_type,
              ct.priority,
              ct.deadline,
              ct.status,
              tc.user_id AS faculty_id,
              u.full_name AS faculty_name,
              DATEDIFF(CURDATE(), ct.deadline) AS days_overdue,
              TRUE AS is_collaborative
         FROM collaborative_tasks ct
         JOIN task_collaborators tc ON tc.task_id = ct.id
         JOIN users u ON u.id = tc.user_id
        WHERE ct.deadline IS NOT NULL
          AND ct.deadline < NOW()
          AND LOWER(ct.status) NOT IN (${DONE_STATUSES.map(() => "?").join(",")})
          AND u.role = 'faculty' AND u.status = 'approved' AND u.is_active = 1
      `;
    }
    
    query += `
        ORDER BY deadline ASC`;

    const [rows] = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.error("[facultyScore] Delayed documents fetch error:", err);
    // Return empty array on error to prevent crashes
    return [];
  }
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
  // tasks: is_done, is_active, is_pending, is_overdue(NOT IN)
  // collaborative_tasks: is_done, is_active, is_pending, is_overdue(NOT IN)
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