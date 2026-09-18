#!/usr/bin/env node
/**
 * Add uploaded_by and uploaded_at columns to task_attachments table
 * to track who uploaded each file and when
 */

const db = require("../config/db");

async function addUploadedByColumn() {
  const conn = await db.getConnection();
  try {
    console.log("Adding uploaded_by and uploaded_at columns to task_attachments...");

    // Check if columns already exist
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'task_attachments' AND COLUMN_NAME IN ('uploaded_by', 'uploaded_at')
    `);

    if (columns.length > 0) {
      console.log("✓ Columns already exist. Skipping migration.");
      conn.release();
      return;
    }

    // Add uploaded_by column (references users.id)
    await conn.query(`
      ALTER TABLE task_attachments 
      ADD COLUMN uploaded_by INT UNSIGNED,
      ADD COLUMN uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ADD FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    `);

    console.log("✓ Successfully added uploaded_by and uploaded_at columns");
    conn.release();
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    conn.release();
    process.exit(1);
  }
}

addUploadedByColumn();
