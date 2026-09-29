-- Add revision_instructions column to tasks table
-- This stores the detailed instructions for faculty when admin/progchair requests revision

ALTER TABLE tasks 
ADD COLUMN revision_instructions TEXT;
