-- Migration: Change all "Received" statuses to "Approved"
-- This ensures consistency with the new status naming convention

-- Update tasks table
UPDATE tasks 
SET status = 'Approved', updated_at = NOW() 
WHERE status = 'Received';

-- Update collaborative_tasks table
UPDATE collaborative_tasks 
SET status = 'Approved', updated_at = NOW() 
WHERE status = 'Received';

-- Update form_submissions table  
UPDATE form_submissions 
SET status = 'Approved', updated_at = NOW() 
WHERE status = 'Received';

-- Show count of updated records
SELECT 
  'tasks' as table_name, 
  COUNT(*) as updated_count 
FROM tasks 
WHERE status = 'Approved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
UNION ALL
SELECT 
  'collaborative_tasks', 
  COUNT(*) 
FROM collaborative_tasks 
WHERE status = 'Approved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
UNION ALL
SELECT 
  'form_submissions', 
  COUNT(*) 
FROM form_submissions 
WHERE status = 'Approved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE);
