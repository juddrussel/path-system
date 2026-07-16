// utils/taskTrackingId.js
//
// Extracted verbatim from routes/task.routes.js. The logic is UNCHANGED —
// this is a relocation, not a rewrite — so POST /api/tasks and
// POST /api/tasks/draft behave exactly as before.
//
// Why extract it: workflowExecution.service.js needs to create tasks using
// this exact same collision-safe tracking-id logic (see task_assignment
// node auto-creation), and task.routes.js needs to call INTO the workflow
// service when a task is approved/returned. If workflowExecution.service.js
// required task.routes.js directly, and task.routes.js required
// workflowExecution.service.js back, that's a circular require — Node.js
// doesn't error on this, but depending on load order one side can get an
// incomplete/undefined export, which is a subtle, hard-to-debug failure
// mode. Pulling the shared piece out into its own leaf module (no requires
// on either routes file) avoids the cycle entirely.

const db = require("../config/db");

// ─── generate the next tracking ID ────────────────────────────────────────
// Looks at the highest sequence number already used THIS YEAR (parsed out of
// existing tracking_id values) and returns the next one. Unlike COUNT(*),
// this is unaffected by deleted rows — MAX only ever goes up.
async function generateTrackingId(offset = 0) {
  const year = new Date().getFullYear();
  const [[{ max_seq }]] = await db.query(
    `SELECT MAX(CAST(SUBSTRING_INDEX(tracking_id, '-', -1) AS UNSIGNED)) AS max_seq
     FROM tasks
     WHERE tracking_id LIKE ?`,
    [`TASK-${year}-%`]
  );
  const seq = (max_seq || 0) + 1 + offset;
  return `TASK-${year}-${String(seq).padStart(4, "0")}`;
}

// ─── insert a task row with a guaranteed-unique tracking_id ──────────────
// Generates a tracking_id, attempts the insert, and if it ever collides
// (ER_DUP_ENTRY) regenerates a higher number and retries, up to maxAttempts.
// `runInsert(tracking_id)` should perform the INSERT and return its result.
async function insertTaskWithUniqueTrackingId(runInsert, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tracking_id = await generateTrackingId(attempt);
    try {
      const result = await runInsert(tracking_id);
      return { tracking_id, result };
    } catch (err) {
      const isDup = err.code === "ER_DUP_ENTRY" && /tracking_id/.test(err.sqlMessage || "");
      if (isDup && attempt < maxAttempts - 1) continue;
      throw err;
    }
  }
}

module.exports = { generateTrackingId, insertTaskWithUniqueTrackingId };