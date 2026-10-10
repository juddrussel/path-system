-- Ensure the role column has no default value
-- This allows explicit 'team_leader' and 'contributor' values to be inserted

ALTER TABLE task_collaborators 
MODIFY COLUMN role VARCHAR(50) DEFAULT NULL;

-- Update any existing NULL roles to 'contributor' (safety measure)
UPDATE task_collaborators 
SET role = 'contributor' 
WHERE role IS NULL;

-- Show the result
SELECT 'Column updated successfully' AS status;
SHOW COLUMNS FROM task_collaborators WHERE Field = 'role';
