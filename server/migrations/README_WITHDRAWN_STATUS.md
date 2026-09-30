# Add "Withdrawn" Status Migration

## Purpose
This migration adds the "Withdrawn" status to the `form_submissions` table's status ENUM column, allowing faculty members to withdraw their form submissions before they've been reviewed.

## When to Run
Run this migration immediately after deploying the withdrawal feature code.

## How to Run

### Option 1: Direct MySQL/MariaDB Command
```bash
# Connect to your database
mysql -u your_username -p your_database_name

# Run the migration
source server/migrations/add_withdrawn_status_to_form_submissions.sql
```

### Option 2: Using MySQL Workbench or phpMyAdmin
1. Open your database management tool
2. Select the database
3. Copy and paste the SQL from `add_withdrawn_status_to_form_submissions.sql`
4. Execute the query

### Option 3: Using Node.js script
```bash
cd server
node -e "
const db = require('./config/db');
(async () => {
  try {
    await db.query(\"ALTER TABLE form_submissions MODIFY COLUMN status ENUM('Draft', 'Pending', 'Revision', 'Approved', 'Rejected', 'Withdrawn') DEFAULT 'Pending'\");
    console.log('✅ Successfully added Withdrawn status');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
})();
"
```

## What Changes
- **Before**: `status ENUM('Draft', 'Pending', 'Revision', 'Approved', 'Rejected')`
- **After**: `status ENUM('Draft', 'Pending', 'Revision', 'Approved', 'Rejected', 'Withdrawn')`

## Verification
After running the migration, verify with:
```sql
SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'form_submissions' AND COLUMN_NAME = 'status';
```

Expected output should include 'Withdrawn' in the enum values.

## Rollback
If you need to rollback (remove Withdrawn status):
```sql
-- WARNING: This will fail if any records have status='Withdrawn'
-- Delete withdrawn records first if needed
ALTER TABLE form_submissions 
MODIFY COLUMN status ENUM('Draft', 'Pending', 'Revision', 'Approved', 'Rejected') 
DEFAULT 'Pending';
```

## Related Files
- `server/routes/form.routes.js` - Contains the `/withdraw` endpoint
- `client/src/pages/DocumentReview.jsx` - Frontend withdraw button
