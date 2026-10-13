-- ===================================================
-- Script to delete Tasks 3 & 4 and reset auto-increment
-- ===================================================
-- Run this in your database management tool or Render MySQL shell
-- ===================================================

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- Start transaction for safety
START TRANSACTION;

-- Show what will be deleted
SELECT '=== TASKS TO BE DELETED ===' AS '';
SELECT id, title, is_collaborative, status, created_at 
FROM tasks 
WHERE id IN (3, 4);

-- ===================================================
-- DELETE TASK 3
-- ===================================================

SELECT '=== Deleting Task 3 ===' AS '';

-- 1. Delete task comments for task 3
DELETE FROM task_comments WHERE task_id = 3;

-- 2. Delete task confirmations for task 3
DELETE FROM task_confirmations WHERE task_id = 3;

-- 3. Delete task collaborators for task 3
DELETE FROM task_collaborators WHERE task_id = 3;

-- 4. Delete task revision files for task 3
DELETE FROM task_revision_files WHERE task_id = 3;

-- 5. Delete task final outputs for task 3
DELETE FROM task_final_outputs WHERE task_id = 3;

-- 6. Delete task attachments for task 3
DELETE FROM task_attachments WHERE task_id = 3;

-- 7. Delete notifications for task 3
DELETE FROM notifications WHERE task_id = 3;

-- 8. Delete audit logs for task 3
DELETE FROM audit_log WHERE document_id = 3;

-- 9. Delete SLA alerts for task 3
DELETE FROM sla_alerts WHERE task_id = 3;

-- 10. Delete the task 3 itself
DELETE FROM tasks WHERE id = 3;

-- ===================================================
-- DELETE TASK 4
-- ===================================================

SELECT '=== Deleting Task 4 ===' AS '';

-- 1. Delete task comments for task 4
DELETE FROM task_comments WHERE task_id = 4;

-- 2. Delete task confirmations for task 4
DELETE FROM task_confirmations WHERE task_id = 4;

-- 3. Delete task collaborators for task 4
DELETE FROM task_collaborators WHERE task_id = 4;

-- 4. Delete task revision files for task 4
DELETE FROM task_revision_files WHERE task_id = 4;

-- 5. Delete task final outputs for task 4
DELETE FROM task_final_outputs WHERE task_id = 4;

-- 6. Delete task attachments for task 4
DELETE FROM task_attachments WHERE task_id = 4;

-- 7. Delete notifications for task 4
DELETE FROM notifications WHERE task_id = 4;

-- 8. Delete audit logs for task 4
DELETE FROM audit_log WHERE document_id = 4;

-- 9. Delete SLA alerts for task 4
DELETE FROM sla_alerts WHERE task_id = 4;

-- 10. Delete the task 4 itself
DELETE FROM tasks WHERE id = 4;

-- ===================================================
-- RESET AUTO-INCREMENT
-- ===================================================

SELECT '=== Resetting auto-increment to 3 ===' AS '';

-- This will make the next inserted task have id = 3
ALTER TABLE tasks AUTO_INCREMENT = 3;

-- Verify deletion and auto-increment value
SELECT '=== VERIFICATION ===' AS '';
SELECT COUNT(*) AS remaining_tasks_3_or_4 FROM tasks WHERE id IN (3, 4);

SELECT '=== Current tasks in database ===' AS '';
SELECT id, title, status FROM tasks ORDER BY id;

SELECT '=== Auto-increment value ===' AS '';
SELECT AUTO_INCREMENT 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'tasks';

-- Commit the transaction
COMMIT;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

SELECT '=== Tasks 3 and 4 deleted successfully! Next task will be ID 3 ===' AS '';
