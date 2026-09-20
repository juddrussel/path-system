#!/usr/bin/env node
/**
 * Migration: Add collaborative editing tables for Phase 1+
 * Tables: syllabus_documents, document_versions, document_audit_log, approvals
 * Alter: task_collaborators (add role column)
 */

const db = require("../config/db");

async function runMigration() {
  const conn = await db.getConnection();
  try {
    console.log("🔄 Starting collab migration...\n");

    // ── 1. Add role column to task_collaborators ──
    console.log("1. Adding 'role' column to task_collaborators...");
    try {
      await conn.query(`
        ALTER TABLE task_collaborators 
        ADD COLUMN role ENUM('lead', 'editor', 'reviewer') NOT NULL DEFAULT 'editor'
      `);
      console.log("   ✓ Column added");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("   ✓ Column already exists");
      } else {
        throw err;
      }
    }

    // ── 2. Create syllabus_documents table (without FK to document_versions yet) ──
    console.log("\n2. Creating syllabus_documents table...");
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS syllabus_documents (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          task_id INT NOT NULL UNIQUE,
          status ENUM('draft', 'in_review', 'approved', 'submitted') NOT NULL DEFAULT 'draft',
          ydoc_state LONGBLOB,
          current_version_id INT UNSIGNED,
          created_by INT NOT NULL,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
          
          INDEX idx_task_id (task_id),
          INDEX idx_status (status),
          INDEX idx_updated_at (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   ✓ Table created");
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("   ✓ Table already exists");
      } else {
        throw err;
      }
    }

    // ── 3. Create document_versions table ──
    console.log("\n3. Creating document_versions table...");
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS document_versions (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          document_id INT UNSIGNED NOT NULL,
          version_no INT NOT NULL,
          kind ENUM('autosave', 'review', 'submitted') NOT NULL DEFAULT 'autosave',
          snapshot LONGTEXT,
          content_hash CHAR(64),
          ydoc_state LONGBLOB,
          created_by INT NOT NULL,
          label VARCHAR(255),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (document_id) REFERENCES syllabus_documents(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
          
          UNIQUE KEY unique_version (document_id, version_no),
          INDEX idx_document_id (document_id),
          INDEX idx_kind (kind),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   ✓ Table created");
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("   ✓ Table already exists");
      } else {
        throw err;
      }
    }

    // ── 4. Create document_audit_log table ──
    console.log("\n4. Creating document_audit_log table...");
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS document_audit_log (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          document_id INT UNSIGNED NOT NULL,
          user_id INT NOT NULL,
          section_key VARCHAR(50),
          action VARCHAR(50) NOT NULL,
          summary TEXT,
          version_id INT UNSIGNED,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (document_id) REFERENCES syllabus_documents(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
          FOREIGN KEY (version_id) REFERENCES document_versions(id) ON DELETE SET NULL,
          
          INDEX idx_document_id (document_id),
          INDEX idx_user_id (user_id),
          INDEX idx_action (action),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   ✓ Table created");
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("   ✓ Table already exists");
      } else {
        throw err;
      }
    }

    // ── 5. Create approvals table ──
    console.log("\n5. Creating approvals table...");
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS approvals (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          task_id INT NOT NULL,
          user_id INT NOT NULL,
          version_id INT UNSIGNED NOT NULL,
          status ENUM('approved', 'changes_requested') NOT NULL,
          comment TEXT,
          decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (version_id) REFERENCES document_versions(id) ON DELETE CASCADE,
          
          UNIQUE KEY unique_approval (version_id, user_id),
          INDEX idx_task_id (task_id),
          INDEX idx_status (status),
          INDEX idx_decided_at (decided_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("   ✓ Table created");
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("   ✓ Table already exists");
      } else {
        throw err;
      }
    }

    console.log("\n6. Adding FK constraint to syllabus_documents.current_version_id...");
    try {
      await conn.query(`
        ALTER TABLE syllabus_documents 
        ADD CONSTRAINT fk_current_version 
        FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL
      `);
      console.log("   ✓ Constraint added");
    } catch (err) {
      if (err.code === "ER_DUP_KEYNAME") {
        console.log("   ✓ Constraint already exists");
      } else {
        throw err;
      }
    }

    console.log("\n✅ Migration complete!");
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    conn.release();
    process.exit(1);
  }
}

runMigration();
