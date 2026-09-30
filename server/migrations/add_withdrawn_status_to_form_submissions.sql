-- Add 'Withdrawn' status to form_submissions table
-- This allows faculty to withdraw their submissions before review

-- First, check the current enum values
-- SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'form_submissions' AND COLUMN_NAME = 'status';

-- Alter the status column to include 'Withdrawn'
-- Note: Including all existing values to ensure no data loss
ALTER TABLE form_submissions 
MODIFY COLUMN status ENUM('Draft', 'Pending', 'Reviewing', 'Revision', 'Approved', 'Rejected', 'Withdrawn') 
DEFAULT 'Pending';

-- Verify the change
SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'form_submissions' AND COLUMN_NAME = 'status';
