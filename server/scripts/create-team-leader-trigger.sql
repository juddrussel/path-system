-- Create a trigger to automatically set the first collaborator as team_leader
-- This will work even if the backend code fails

DELIMITER $$

DROP TRIGGER IF EXISTS set_first_collaborator_as_team_leader$$

CREATE TRIGGER set_first_collaborator_as_team_leader
BEFORE INSERT ON task_collaborators
FOR EACH ROW
BEGIN
  DECLARE first_collab INT;
  DECLARE task_is_collab TINYINT;
  
  -- Check if this task is collaborative
  SELECT is_collaborative INTO task_is_collab
  FROM tasks 
  WHERE id = NEW.task_id
  LIMIT 1;
  
  -- Only proceed if it's a collaborative task
  IF task_is_collab = 1 THEN
    -- Check if this is the first collaborator for this task
    SELECT COUNT(*) INTO first_collab
    FROM task_collaborators
    WHERE task_id = NEW.task_id;
    
    -- If no collaborators exist yet, this is the first one - make them team leader
    IF first_collab = 0 THEN
      SET NEW.role = 'team_leader';
    ELSE
      -- If role is NULL or empty, default to contributor
      IF NEW.role IS NULL OR NEW.role = '' THEN
        SET NEW.role = 'contributor';
      END IF;
    END IF;
  END IF;
END$$

DELIMITER ;

-- Test: This query will show if the trigger was created successfully
SHOW TRIGGERS WHERE `Trigger` = 'set_first_collaborator_as_team_leader';
