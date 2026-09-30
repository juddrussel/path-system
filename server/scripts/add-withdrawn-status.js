/**
 * Migration script to add 'Withdrawn' status to form_submissions table
 * Run this once to update the database schema
 */

const db = require('../config/db');

async function runMigration() {
  try {
    console.log('🔄 Running migration: Add Withdrawn status to form_submissions...');
    
    // Check current enum values
    const [current] = await db.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'form_submissions' 
      AND COLUMN_NAME = 'status'
    `);
    
    console.log('Current status enum:', current[0]?.COLUMN_TYPE);
    
    // Check if Withdrawn already exists
    if (current[0]?.COLUMN_TYPE?.includes('Withdrawn')) {
      console.log('✅ Migration already applied - Withdrawn status already exists');
      process.exit(0);
    }
    
    // Add Withdrawn to the enum
    await db.query(`
      ALTER TABLE form_submissions 
      MODIFY COLUMN status ENUM('Draft', 'Pending', 'Reviewing', 'Revision', 'Approved', 'Rejected', 'Withdrawn') 
      DEFAULT 'Pending'
    `);
    
    console.log('✅ Successfully added Withdrawn status to form_submissions');
    
    // Verify the change
    const [updated] = await db.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'form_submissions' 
      AND COLUMN_NAME = 'status'
    `);
    
    console.log('Updated status enum:', updated[0]?.COLUMN_TYPE);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runMigration();
