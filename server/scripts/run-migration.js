/**
 * Manual migration runner
 * Run: node scripts/run-migration.js
 * This forces the collaborative tasks schema update
 */

require("dotenv").config();
const db = require("../config/db");

async function runMigration() {
  try {
    console.log("[Migration] Starting collaborative tasks schema update...\n");

    // 1. Update tasks table
    console.log("[1/5] Updating tasks table...");
    await db.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS assignment_type ENUM('individual','collaborative') DEFAULT 'individual' AFTER is_collaborative,
      ADD COLUMN IF NOT EXISTS current_output_version INT DEFAULT 0 AFTER assignment_type,
      ADD COLUMN IF NOT EXISTS all_confirmed_at DATETIME AFTER current_output_version,
      ADD COLUMN IF NOT EXISTS submitted_at DATETIME AFTER all_confirmed_at,
      ADD COLUMN IF NOT EXISTS instructions LONGTEXT AFTER submitted_at
    `);
    console.log("✓ tasks table updated\n");

    // 2. Create task_final_outputs table
    console.log("[2/5] Creating task_final_outputs table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_final_outputs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        version INT NOT NULL,
        file_url VARCHAR(1024) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        uploaded_by INT NOT NULL,
        upload_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_task_version (task_id, version),
        INDEX idx_task_id (task_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ task_final_outputs table created\n");

    // 3. Create task_confirmations table
    console.log("[3/5] Creating task_confirmations table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_confirmations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        output_version INT NOT NULL,
        confirmed_at DATETIME,
        withdrawn_at DATETIME,
        status ENUM('pending','confirmed','withdrawn') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_user_version (task_id, user_id, output_version),
        INDEX idx_task_id (task_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ task_confirmations table created\n");

    // 4. Update task_collaborators table
    console.log("[4/5] Updating task_collaborators table...");
    await db.query(`
      ALTER TABLE task_collaborators 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'contributor' AFTER user_id,
      ADD COLUMN IF NOT EXISTS current_version_confirmed TINYINT DEFAULT 0 AFTER confirmed_at,
      ADD KEY idx_role (role)
    `);
    console.log("✓ task_collaborators table updated\n");

    // 5. Create task_comments table
    console.log("[5/5] Creating task_comments table...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        content LONGTEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_task_id (task_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ task_comments table created\n");

    console.log("[Migration] ✓ All schema updates completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("[Migration] Error:", error.message);
    process.exit(1);
  }
}

runMigration();
