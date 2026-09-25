/**
 * Add note column to task_attachments table
 * Allows storing submission notes with each uploaded file
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addNoteColumn() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Adding note column to task_attachments...');
    
    // Check if column already exists
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'task_attachments' AND COLUMN_NAME = 'note'
    `);

    if (columns.length > 0) {
      console.log('✓ note column already exists');
      return;
    }

    // Add note column
    await conn.query(`
      ALTER TABLE task_attachments 
      ADD COLUMN note TEXT NULL
      AFTER uploaded_by
    `);
    
    console.log('✓ note column added to task_attachments');
    
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    console.log('✓ note column already exists');
  } finally {
    await conn.end();
  }
}

addNoteColumn().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
