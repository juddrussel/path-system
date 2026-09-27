const mysql = require("mysql2/promise");
require("dotenv").config();

/**
 * Migration: Add Collaborative Task Support
 * 
 * Updates:
 * 1. Adds collaborative task fields to tasks table
 * 2. Creates task_final_outputs table (versioned final files)
 * 3. Creates task_confirmations table (per-collaborator confirmations)
 * 4. Updates task_collaborators table with version tracking
 */

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log("[Migration] Starting collaborative tasks schema update...\n");

    // 1. Update tasks table with collaborative workflow fields
    console.log("[1/4] Updating tasks table...");
    await connection.execute(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS assignment_type ENUM('individual','collaborative') DEFAULT 'individual' AFTER is_collaborative,
      ADD COLUMN IF NOT EXISTS current_output_version INT DEFAULT 0 AFTER assignment_type,
      ADD COLUMN IF NOT EXISTS all_confirmed_at DATETIME AFTER current_output_version,
      ADD COLUMN IF NOT EXISTS submitted_at DATETIME AFTER all_confirmed_at,
      ADD KEY idx_assignment_type (assignment_type),
      ADD KEY idx_output_version (current_output_version)
    `);
    console.log("✓ tasks table updated\n");

    // 2. Create task_final_outputs table
    console.log("[2/4] Creating task_final_outputs table...");
    await connection.execute(`
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
    console.log("[3/4] Creating task_confirmations table...");
    await connection.execute(`
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

    // 4. Update task_collaborators table with role and confirmation tracking
    console.log("[4/4] Updating task_collaborators table...");
    await connection.execute(`
      ALTER TABLE task_collaborators 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'contributor' AFTER user_id,
      ADD COLUMN IF NOT EXISTS current_version_confirmed TINYINT DEFAULT 0 AFTER confirmed_at,
      ADD KEY idx_role (role)
    `);
    console.log("✓ task_collaborators table updated\n");

    console.log("[Migration] ✓ All schema updates completed successfully!\n");
    console.log("New/Updated Tables:");
    console.log("  - task_final_outputs (new) — Versioned final output files");
    console.log("  - task_confirmations (new) — Per-collaborator confirmations by version");
    console.log("  - tasks (updated) — Added assignment_type, current_output_version, all_confirmed_at");
    console.log("  - task_collaborators (updated) — Added role, current_version_confirmed\n");

  } catch (error) {
    console.error("[Migration] Error:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
