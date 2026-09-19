#!/usr/bin/env node
/**
 * Create task_collaborators table to support multiple collaborators per task
 * This allows tasks to have more than 2 collaborators
 */

const db = require("../config/db");

async function createTaskCollaboratorsTable() {
  const conn = await db.getConnection();
  try {
    console.log("Creating task_collaborators table...");

    // Check if table already exists
    const [tables] = await conn.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_collaborators'
    `);

    if (tables.length > 0) {
      console.log("✓ task_collaborators table already exists. Skipping migration.");
      conn.release();
      return;
    }

    // Create the table
    await conn.query(`
      CREATE TABLE task_collaborators (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        confirmed_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_task_user (task_id, user_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_task_id (task_id),
        INDEX idx_user_id (user_id),
        INDEX idx_confirmed_at (confirmed_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("✓ Successfully created task_collaborators table");
    conn.release();
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    conn.release();
    process.exit(1);
  }
}

createTaskCollaboratorsTable();
