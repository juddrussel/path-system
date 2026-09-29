-- Remove unique constraint to allow multiple files per version
-- This allows collaborative tasks to have multiple files in a single version

-- First, check if the constraint exists and drop it
ALTER TABLE task_final_outputs 
DROP INDEX IF EXISTS unique_task_version;

-- Optionally, if you want to ensure there's a primary key on id
-- (it should already exist, but just in case)
ALTER TABLE task_final_outputs 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- Add a comment explaining the change
ALTER TABLE task_final_outputs 
COMMENT = 'Stores final outputs for tasks. Multiple files allowed per version for collaborative tasks.';
