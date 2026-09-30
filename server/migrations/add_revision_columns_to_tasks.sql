-- Migration: Add revision columns to tasks table
-- Purpose: Support enhanced "Return for Revision" feature with structured data
-- Date: 2024

-- Add columns for storing revision request details
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS revision_instruction TEXT NULL COMMENT 'Detailed instructions for what needs to be revised',
ADD COLUMN IF NOT EXISTS revision_files JSON NULL COMMENT 'Array of file attachments sent with revision request: [{url, name, size}]';

-- Update existing tasks with old return_reason format to maintain compatibility
-- (Optional: only if you want to backfill data)
-- UPDATE tasks 
-- SET revision_instruction = return_reason 
-- WHERE return_reason IS NOT NULL 
--   AND revision_instruction IS NULL 
--   AND status = 'Returned for revision';

-- Verify the columns were added
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'tasks'
  AND COLUMN_NAME IN ('revision_instruction', 'revision_files', 'return_reason');
