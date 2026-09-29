-- Add revision file fields to tasks table
-- These fields store the admin/progchair's attachment when requesting revision

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS revision_file_url TEXT,
ADD COLUMN IF NOT EXISTS revision_file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS revision_file_size INT;

-- Add comment for documentation
COMMENT ON COLUMN tasks.revision_file_url IS 'R2 URL of file attached by admin/progchair when requesting revision';
COMMENT ON COLUMN tasks.revision_file_name IS 'Original filename of revision attachment';
COMMENT ON COLUMN tasks.revision_file_size IS 'File size in bytes of revision attachment';
