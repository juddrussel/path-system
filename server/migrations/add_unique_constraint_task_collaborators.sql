-- Add unique constraint to task_collaborators to prevent duplicate entries
-- This ensures each user can only be added once per task

-- First, remove any existing duplicates (keep the oldest entry for each task_id, user_id pair)
DELETE tc1 FROM task_collaborators tc1
INNER JOIN task_collaborators tc2 
WHERE tc1.task_id = tc2.task_id 
  AND tc1.user_id = tc2.user_id 
  AND tc1.id > tc2.id;

-- Now add the unique constraint
ALTER TABLE task_collaborators
ADD UNIQUE KEY unique_task_user (task_id, user_id);
