-- ════════════════════════════════════════════════════════════════════════════════
-- DATABASE RESET SCRIPT FOR TESTING
-- ════════════════════════════════════════════════════════════════════════════════
-- This script clears all transactional data while preserving:
-- - Users and authentication
-- - Categories (document types, task types)
-- - Workflows and workflow templates
-- - SLA configurations
-- - Form templates
--
-- USE WITH CAUTION: This will delete all your submissions, tasks, and activity data!
-- ════════════════════════════════════════════════════════════════════════════════

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- ════════════════════════════════════════════════════════════════════════════════
-- FORM SUBMISSIONS & RELATED DATA
-- ════════════════════════════════════════════════════════════════════════════════

-- Clear form submissions (includes withdrawn forms)
TRUNCATE TABLE form_submissions;

-- Clear form revision files if exists
-- TRUNCATE TABLE form_revision_files;

-- ════════════════════════════════════════════════════════════════════════════════
-- TASKS & COLLABORATIVE TASKS
-- ════════════════════════════════════════════════════════════════════════════════

-- Clear task assignments and progress
TRUNCATE TABLE task_assignments;
TRUNCATE TABLE task_progress;

-- Clear task comments and activity
TRUNCATE TABLE task_comments;
-- TRUNCATE TABLE task_activity;

-- Clear task attachments and final outputs
TRUNCATE TABLE task_attachments;
TRUNCATE TABLE task_final_outputs;

-- Clear task revision data
-- TRUNCATE TABLE task_revision_requests;
-- TRUNCATE TABLE task_revision_files;

-- Clear collaborative task data
TRUNCATE TABLE collaborative_tasks;
-- TRUNCATE TABLE collaborative_task_assignments;
-- TRUNCATE TABLE task_confirmations;

-- Clear task changelog
-- TRUNCATE TABLE task_changelog;

-- Clear main tasks table
TRUNCATE TABLE tasks;

-- Clear archived tasks
TRUNCATE TABLE user_task_archives;

-- ════════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS & ACTIVITY
-- ════════════════════════════════════════════════════════════════════════════════

-- Clear all notifications
TRUNCATE TABLE notifications;

-- Clear audit logs (if you want to preserve audit trail, comment this out)
-- TRUNCATE TABLE audit_logs;

-- ════════════════════════════════════════════════════════════════════════════════
-- MESSAGES & HELP DESK
-- ════════════════════════════════════════════════════════════════════════════════

-- Clear messages/inbox
-- TRUNCATE TABLE messages;

-- Clear help desk tickets
-- TRUNCATE TABLE help_desk_tickets;
-- TRUNCATE TABLE help_desk_responses;

-- ════════════════════════════════════════════════════════════════════════════════
-- WORKFLOW EXECUTION DATA (NOT TEMPLATES)
-- ════════════════════════════════════════════════════════════════════════════════

-- Clear workflow execution logs (preserves workflow templates)
-- TRUNCATE TABLE workflow_executions;
-- TRUNCATE TABLE workflow_execution_logs;

-- ════════════════════════════════════════════════════════════════════════════════
-- SLA TRACKING DATA (NOT RULES)
-- ════════════════════════════════════════════════════════════════════════════════

-- Clear SLA breach records
-- TRUNCATE TABLE sla_breaches;

-- ════════════════════════════════════════════════════════════════════════════════
-- REPORTS & ANALYTICS DATA
-- ════════════════════════════════════════════════════════════════════════════════

-- Clear generated reports
-- TRUNCATE TABLE reports;

-- Clear analytics/metrics
-- TRUNCATE TABLE analytics_metrics;

-- ════════════════════════════════════════════════════════════════════════════════
-- RE-ENABLE FOREIGN KEY CHECKS
-- ════════════════════════════════════════════════════════════════════════════════

SET FOREIGN_KEY_CHECKS = 1;

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ════════════════════════════════════════════════════════════════════════════════

-- Verify reset (should all return 0 or small numbers)
SELECT 'form_submissions' AS table_name, COUNT(*) AS count FROM form_submissions
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'collaborative_tasks', COUNT(*) FROM collaborative_tasks
UNION ALL
SELECT 'task_assignments', COUNT(*) FROM task_assignments
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'task_comments', COUNT(*) FROM task_comments;

-- Verify preserved data (should have your configuration)
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'workflows', COUNT(*) FROM workflows
UNION ALL
SELECT 'sla_rules', COUNT(*) FROM sla_rules
UNION ALL
SELECT 'form_templates', COUNT(*) FROM form_templates;

-- ════════════════════════════════════════════════════════════════════════════════
-- OPTIONAL: RESET AUTO INCREMENT COUNTERS
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE form_submissions AUTO_INCREMENT = 1;
ALTER TABLE tasks AUTO_INCREMENT = 1;
ALTER TABLE collaborative_tasks AUTO_INCREMENT = 1;
ALTER TABLE task_assignments AUTO_INCREMENT = 1;
ALTER TABLE task_comments AUTO_INCREMENT = 1;
ALTER TABLE task_attachments AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;

-- ════════════════════════════════════════════════════════════════════════════════
-- DONE!
-- ════════════════════════════════════════════════════════════════════════════════

SELECT '✅ Database reset complete!' AS status;
SELECT 'All transactional data cleared.' AS message;
SELECT 'Users, categories, workflows, and SLA rules preserved.' AS note;
