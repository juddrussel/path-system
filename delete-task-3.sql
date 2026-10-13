-- ===================================================
-- Script to delete Task ID 3 and reset auto-increment
-- ===================================================
-- Run this in your database management tool or Render MySQL shell
-- ===================================================

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- Start transaction for safety
START TRANSACTION;

-- Show what will be deleted
SELECT '=== TASK TO BE DELETED ===' AS '';
SELECT id, title, is_collaborative, status, created_at 
FROM tasks 
WHERE id = 3;

-- Delete related records in order (respecting foreign keys)

-- 1. Delete task comments (discussion messages) and their replies
SELECT '=== Deleting task comments and replies ===' AS '';
DELETE FROM task_comments WHERE task_id = 3;

-- 2. Delete task confirmations
SELECT '=== Deleting task confirmations ===' AS '';
DELETE FROM task_confirmations WHERE task_id = 3;

-- 3. Delete task collaborators
SELECT '=== Deleting collaborators ===' AS '';
DELETE FROM task_collaborators WHERE task_id = 3;

-- 4. Delete task revision files
SELECT '=== Deleting revision files ===' AS '';
DELETE FROM task_revision_files WHERE task_id = 3;

-- 5. Delete task final outputs
SELECT '=== Deleting final outputs ===' AS '';
DELETE FROM task_final_outputs WHERE task_id = 3;

-- 6. Delete task attachments
SELECT '=== Deleting task attachments ===' AS '';
DELETE FROM task_attachments WHERE task_id = 3;

-- 7. Delete notifications related to this task
SELECT '=== Deleting notifications ===' AS '';
DELETE FROM notifications WHERE task_id = 3;

-- 8. Delete audit logs for this task (if any exist with document_id = 3)
SELECT '=== Deleting audit logs ===' AS '';
DELETE FROM audit_log WHERE document_id = 3;

-- 9. Delete SLA alerts for this task (if table exists)
SELECT '=== Deleting SLA alerts ===' AS '';
DELETE FROM sla_alerts WHERE task_id = 3;

-- 10. Finally, delete the task itself
SELECT '=== Deleting the task ===' AS '';
DELETE FROM tasks WHERE id = 3;

-- ===================================================
-- RESET AUTO-INCREMENT
-- ===================================================

SELECT '=== Resetting auto-increment to 3 ===' AS '';

-- This will make the next inserted task have id = 3
ALTER TABLE tasks AUTO_INCREMENT = 3;

-- Verify deletion and auto-increment value
SELECT '=== VERIFICATION: Task should not exist ===' AS '';
SELECT COUNT(*) AS task_count FROM tasks WHERE id = 3;

SELECT '=== Current tasks in database ===' AS '';
SELECT id, title, status FROM tasks ORDER BY id;

SELECT '=== Auto-increment value ===' AS '';
SELECT AUTO_INCREMENT 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'tasks';

-- If everything looks good, commit the transaction
COMMIT;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

SELECT '=== Task 3 deleted successfully! Next task will be ID 3 ===' AS '';
