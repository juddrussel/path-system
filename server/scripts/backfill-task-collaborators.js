#!/usr/bin/env node
/**
 * Backfill task_collaborators table for existing multi-faculty tasks
 * 
 * This script finds all tasks that were assigned to multiple faculty members
 * (where they share the same assignment_group_id) and ensures all faculty
 * are properly recorded in the task_collaborators table.
 */

const db = require("../config/db");

async function backfillCollaborators() {
  const conn = await db.getConnection();
  try {
    console.log("Starting backfill of task_collaborators...");

    // Find all tasks grouped by assignment_group_id (multi-faculty assignments)
    const [groupedTasks] = await conn.query(`
      SELECT assignment_group_id, GROUP_CONCAT(id) AS task_ids, GROUP_CONCAT(faculty_id) AS faculty_ids
      FROM tasks
      WHERE assignment_group_id IS NOT NULL
      GROUP BY assignment_group_id
    `);

    console.log(`Found ${groupedTasks.length} grouped assignment(s)`);
    let totalInserted = 0;

    for (const group of groupedTasks) {
      const taskIds = group.task_ids.split(',').map(id => parseInt(id, 10));
      const facultyIds = group.faculty_ids.split(',').map(id => parseInt(id, 10));

      console.log(`\nProcessing group: ${group.assignment_group_id}`);
      console.log(`  Tasks: ${taskIds.join(', ')}`);
      console.log(`  Faculty: ${facultyIds.join(', ')}`);

      // For each task in this group, add all faculty members as collaborators
      for (const taskId of taskIds) {
        // Check which faculty members are already in task_collaborators
        const [existingCollabs] = await conn.query(
          `SELECT user_id FROM task_collaborators WHERE task_id = ?`,
          [taskId]
        );
        const existingIds = new Set(existingCollabs.map(c => c.user_id));

        // Insert missing collaborators
        const toInsert = facultyIds.filter(id => !existingIds.has(id));
        if (toInsert.length > 0) {
          const rows = toInsert.map(fId => [taskId, fId]);
          await conn.query(
            `INSERT INTO task_collaborators (task_id, user_id) VALUES ?`,
            [rows]
          );
          console.log(`  Task ${taskId}: Inserted ${toInsert.length} collaborator(s)`);
          totalInserted += toInsert.length;
        } else {
          console.log(`  Task ${taskId}: All collaborators already present`);
        }
      }
    }

    console.log(`\n✓ Backfill complete. Total collaborators inserted: ${totalInserted}`);
    conn.release();
  } catch (err) {
    console.error("❌ Backfill failed:", err.message);
    conn.release();
    process.exit(1);
  }
}

backfillCollaborators();
