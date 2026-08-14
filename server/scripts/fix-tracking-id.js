// scripts/fix-tracking-ids.js
//
// One-off cleanup script: reassigns clean, sequential tracking_ids
// ("FORM-<year>-00001", "FORM-<year>-00002", ...) to every row in
// form_submissions, grouped by the year the row was created and ordered
// chronologically (created_at, then id as a tiebreaker) so the numbering
// reflects submission order.
//
// This fixes legacy/bad rows like "FORM-2026-51111111111" or duplicate
// tracking_ids left over from before the MAX-based generator + retry logic
// was added to routes/form.routes.js.
//
// SAFETY:
//   - Runs as a DRY RUN by default — it only prints what it WOULD change.
//   - Pass --apply to actually write the changes.
//   - Renumbers ALL rows (not just the obviously-broken ones) so the
//     result is guaranteed consistent — mixing "fixed" and "untouched"
//     IDs is how you get new collisions later.
//   - Uses a two-phase update (temp values first, then final values) so it
//     never trips a UNIQUE constraint on tracking_id mid-run, in case one
//     exists (or if you add one afterwards, which is recommended).
//   - Wrapped in a transaction: if anything fails partway, everything
//     rolls back and no rows are left half-renamed.
//
// USAGE:
//   node scripts/fix-tracking-ids.js            # dry run, prints the plan
//   node scripts/fix-tracking-ids.js --apply     # actually applies it
//
// Run this from the same place your app runs (so ../config/db resolves and
// picks up the same DB credentials/env vars as the server).

const db = require("../config/db");

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "Running in APPLY mode — changes WILL be written." : "Running in DRY RUN mode — no changes will be written (pass --apply to write them).");

  // Pull every row, oldest-first, so renumbering preserves submission order.
  // created_at is the real submission time; id is just a tiebreaker for
  // rows created in the same instant.
  const [rows] = await db.query(
    `SELECT id, tracking_id, created_at
     FROM form_submissions
     ORDER BY created_at ASC, id ASC`
  );

  if (!rows.length) {
    console.log("No rows found in form_submissions. Nothing to do.");
    return;
  }

  // Group by the year each row was created in, and assign a fresh
  // sequential number within that year.
  const perYearCounter = {};
  const plan = []; // { id, oldTrackingId, newTrackingId }

  for (const row of rows) {
    const year = new Date(row.created_at).getFullYear();
    perYearCounter[year] = (perYearCounter[year] || 0) + 1;
    const seq = String(perYearCounter[year]).padStart(5, "0");
    const newTrackingId = `FORM-${year}-${seq}`;

    if (newTrackingId !== row.tracking_id) {
      plan.push({ id: row.id, oldTrackingId: row.tracking_id, newTrackingId });
    }
  }

  console.log(`\nTotal rows: ${rows.length}`);
  console.log(`Rows that need a new tracking_id: ${plan.length}\n`);

  if (!plan.length) {
    console.log("Everything is already clean and sequential. Nothing to do.");
    return;
  }

  console.log("Planned changes:");
  for (const change of plan) {
    console.log(`  id=${change.id}  ${change.oldTrackingId || "(empty)"}  ->  ${change.newTrackingId}`);
  }

  if (!APPLY) {
    console.log("\nDry run only — re-run with --apply to write these changes.");
    return;
  }

  const conn = await db.getConnection(); // assumes a mysql2 pool; adjust if your db module differs
  try {
    await conn.beginTransaction();

    // Phase 1: move every row that's changing to a temporary, guaranteed-
    // unique placeholder first, so phase 2 never collides with an old
    // tracking_id that hasn't been renamed yet (only matters if there's a
    // UNIQUE constraint on tracking_id — harmless if there isn't).
    for (const change of plan) {
      await conn.query(
        `UPDATE form_submissions SET tracking_id = ? WHERE id = ?`,
        [`TMP-${change.id}`, change.id]
      );
    }

    // Phase 2: apply the real, final tracking_id.
    for (const change of plan) {
      await conn.query(
        `UPDATE form_submissions SET tracking_id = ? WHERE id = ?`,
        [change.newTrackingId, change.id]
      );
    }

    await conn.commit();
    console.log(`\nDone. Updated ${plan.length} row(s).`);
    console.log("\nRecommended follow-up: add a UNIQUE constraint on form_submissions.tracking_id");
    console.log("if one doesn't already exist, e.g.:");
    console.log("  ALTER TABLE form_submissions ADD UNIQUE KEY uniq_tracking_id (tracking_id);");
    console.log("That, combined with the retry logic already in form.routes.js, prevents this");
    console.log("from happening again under concurrent/duplicate submissions.");
  } catch (err) {
    await conn.rollback();
    console.error("Failed — rolled back all changes.", err);
    process.exitCode = 1;
  } finally {
    conn.release();
  }
}

main()
  .then(() => process.exit(process.exitCode || 0))
  .catch(err => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });