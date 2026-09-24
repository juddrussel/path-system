#!/usr/bin/env node
/**
 * Check database state for task_collaborators table
 */

const db = require("../config/db");

async function checkState() {
  const conn = await db.getConnection();
  try {
    console.log("Checking database state...\n");

    // Check if table exists
    const [tables] = await conn.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_collaborators'
    `);

    if (tables.length === 0) {
      console.log("❌ task_collaborators table does NOT exist!");
      conn.release();
      return;
    }

    console.log("✓ task_collaborators table exists\n");

    // Count entries
    const [count] = await conn.query(`SELECT COUNT(*) AS total FROM task_collaborators`);
    console.log(`  Collaborator entries: ${count[0].total}`);

    // Show sample
    const [samples] = await conn.query(`
      SELECT tc.*, t.tracking_id, u.full_name
      FROM task_collaborators tc
      LEFT JOIN tasks t ON t.id = tc.task_id
      LEFT JOIN users u ON u.id = tc.user_id
      LIMIT 5
    `);

    if (samples.length > 0) {
      console.log("\n  Sample entries:");
      samples.forEach(s => {
        console.log(`    Task ${s.task_id} (${s.tracking_id}): User ${s.user_id} (${s.full_name}), confirmed_at: ${s.confirmed_at}`);
      });
    } else {
      console.log("\n  No entries found in task_collaborators");
    }

    // Check task 16 specifically
    console.log("\n--- Task 16 ---");
    const [task16] = await conn.query(`
      SELECT t.*, u.full_name AS faculty_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.faculty_id
      WHERE t.id = 16
    `);

    if (task16.length > 0) {
      const task = task16[0];
      console.log(`  Tracking ID: ${task.tracking_id}`);
      console.log(`  Faculty ID: ${task.faculty_id} (${task.faculty_name})`);
      console.log(`  Is Collaborative: ${task.is_collaborative}`);
      console.log(`  Assignment Group: ${task.assignment_group_id}`);

      const [collabs16] = await conn.query(
        `SELECT * FROM task_collaborators WHERE task_id = 16`
      );
      console.log(`  Collaborators in task_collaborators: ${collabs16.length}`);
      collabs16.forEach(c => {
        console.log(`    - User ${c.user_id}, confirmed_at: ${c.confirmed_at}`);
      });
    } else {
      console.log("  Task 16 not found");
    }

    conn.release();
  } catch (err) {
    console.error("❌ Error:", err.message);
    conn.release();
    process.exit(1);
  }
}

checkState();
