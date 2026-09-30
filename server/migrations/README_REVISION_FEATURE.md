# Revision Feature Database Migrations

## Overview
These migrations add support for the enhanced "Return for Revision" feature with file attachments to both tasks and document reviews.

## Required Migrations

### 1. Tasks Table (`add_revision_columns_to_tasks.sql`)
Adds columns to store revision request details for regular tasks:
- `revision_instruction` (TEXT) - Detailed instructions for faculty
- `revision_files` (JSON) - Array of attached files `[{url, name, size}]`

### 2. Form Submissions Table (`add_revision_columns_to_form_submissions.sql`)
Adds columns to store revision request details for document reviews:
- `return_reason` (VARCHAR) - Selected reason from dropdown
- `revision_instruction` (TEXT) - Detailed instructions for submitter
- `revision_files` (JSON) - Array of attached files `[{url, name, size}]`

## How to Apply

### Option 1: Direct MySQL Execution
```bash
# Connect to your database
mysql -u your_username -p your_database_name

# Run the migrations
source server/migrations/add_revision_columns_to_tasks.sql
source server/migrations/add_revision_columns_to_form_submissions.sql
```

### Option 2: Using MySQL Client
```bash
mysql -u your_username -p your_database_name < server/migrations/add_revision_columns_to_tasks.sql
mysql -u your_username -p your_database_name < server/migrations/add_revision_columns_to_form_submissions.sql
```

### Option 3: Using Database GUI (phpMyAdmin, MySQL Workbench, etc.)
1. Open your database management tool
2. Select your database
3. Open and execute each SQL file in the SQL tab

### Option 4: Using Node.js Script
You can also create a migration runner or use existing migration tools in your project.

## Verification

After running the migrations, verify the columns were added:

```sql
-- Check tasks table
DESCRIBE tasks;

-- Check form_submissions table
DESCRIBE form_submissions;

-- Or use the verification queries included in each migration file
```

## Rollback (if needed)

To remove these columns:

```sql
-- For tasks
ALTER TABLE tasks 
DROP COLUMN IF EXISTS revision_instruction,
DROP COLUMN IF EXISTS revision_files;

-- For form_submissions
ALTER TABLE form_submissions 
DROP COLUMN IF EXISTS return_reason,
DROP COLUMN IF EXISTS revision_instruction,
DROP COLUMN IF EXISTS revision_files;
```

## Data Structure

### revision_files JSON format:
```json
[
  {
    "url": "https://your-r2-bucket.com/path/to/file.pdf",
    "name": "document.pdf",
    "size": 97205
  }
]
```

## Notes

- These columns are **nullable** - existing records will have NULL values
- The `return_reason` column in tasks table already exists, so only new columns are added
- The migrations use `IF NOT EXISTS` clauses to prevent errors if columns already exist
- No data loss - all existing data is preserved
