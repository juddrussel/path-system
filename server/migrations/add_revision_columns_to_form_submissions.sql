-- Migration: Add revision columns to form_submissions table
-- Purpose: Support enhanced "Return for Revision" feature for document reviews
-- Date: 2024

-- Add columns for storing revision request details
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS return_reason VARCHAR(512) NULL COMMENT 'Selected reason from predefined dropdown',
ADD COLUMN IF NOT EXISTS revision_instruction TEXT NULL COMMENT 'Detailed instructions for what needs to be revised',
ADD COLUMN IF NOT EXISTS revision_files JSON NULL COMMENT 'Array of file attachments sent with revision request: [{url, name, size}]';

-- Update existing forms with review_note to maintain compatibility (optional)
-- UPDATE form_submissions 
-- SET revision_instruction = review_note 
-- WHERE review_note IS NOT NULL 
--   AND revision_instruction IS NULL 
--   AND status = 'Revision';

-- Verify the columns were added
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'form_submissions'
  AND COLUMN_NAME IN ('return_reason', 'revision_instruction', 'revision_files', 'review_note');
