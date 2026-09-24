require("dotenv").config();
const db = require("../config/db");

async function migrate() {
  try {
    console.log("🔄 Starting migration for collaborative features...");

    // Create task_changelog table
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_changelog (
        id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        field_name VARCHAR(100),
        old_value LONGTEXT,
        new_value LONGTEXT,
        changed_by INT NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_task (task_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ task_changelog table created");

    // Create task_comments table with threading support
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        sender_id INT NOT NULL,
        parent_comment_id INT,
        content TEXT NOT NULL,
        files JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_task (task_id),
        INDEX idx_sender (sender_id),
        INDEX idx_parent (parent_comment_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_comment_id) REFERENCES task_comments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✅ task_comments table created");

    // Add parent_comment_id and files columns to existing table if needed
    const checkThreading = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'task_comments' AND COLUMN_NAME = 'parent_comment_id'
    `);
    
    if (checkThreading[0].length === 0) {
      await db.query(`
        ALTER TABLE task_comments 
        ADD COLUMN parent_comment_id INT,
        ADD COLUMN files JSON,
        ADD FOREIGN KEY (parent_comment_id) REFERENCES task_comments(id) ON DELETE CASCADE
      `);
      console.log("✅ Threading columns added to task_comments");
    }

    const checkFiles = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'task_comments' AND COLUMN_NAME = 'files'
    `);
    
    if (checkFiles[0].length === 0) {
      await db.query(`ALTER TABLE task_comments ADD COLUMN files JSON`);
      console.log("✅ Files column added to task_comments");
    }

    // Add confirmed_at column to task_collaborators if it doesn't exist
    const checkColumn = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'task_collaborators' AND COLUMN_NAME = 'confirmed_at'
    `);
    
    if (checkColumn[0].length === 0) {
      await db.query(`
        ALTER TABLE task_collaborators ADD COLUMN confirmed_at TIMESTAMP NULL DEFAULT NULL
      `);
      console.log("✅ confirmed_at column added to task_collaborators");
    } else {
      console.log("⏭️  confirmed_at column already exists");
    }

    console.log("✨ Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

migrate();
