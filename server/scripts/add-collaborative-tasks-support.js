require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_CA_CERT_PATH
      ? { ca: fs.readFileSync(path.resolve(process.env.DB_CA_CERT_PATH)), rejectUnauthorized: true }
      : undefined,
  });

  try {
    console.log('Adding collaborative tasks support columns...');

    await db.execute(`
      ALTER TABLE tasks 
      ADD COLUMN is_collaborative BOOLEAN DEFAULT 0
    `);
    console.log('✓ Added is_collaborative column');

    await db.execute(`
      ALTER TABLE tasks 
      ADD COLUMN collaborator_id INT NULL
    `);
    console.log('✓ Added collaborator_id column');

    await db.execute(`
      ALTER TABLE tasks 
      ADD COLUMN confirmation_status ENUM('awaiting', 'confirmed', 'rejected', 'submitted') DEFAULT 'awaiting'
    `);
    console.log('✓ Added confirmation_status column');

    await db.execute(`
      ALTER TABLE tasks 
      ADD COLUMN user1_confirmed_at TIMESTAMP NULL
    `);
    console.log('✓ Added user1_confirmed_at column');

    await db.execute(`
      ALTER TABLE tasks 
      ADD COLUMN user2_confirmed_at TIMESTAMP NULL
    `);
    console.log('✓ Added user2_confirmed_at column');

    await db.execute(`
      ALTER TABLE tasks 
      ADD COLUMN collaboration_type ENUM('separate', 'together') DEFAULT 'separate'
    `);
    console.log('✓ Added collaboration_type column');

    console.log('\n✅ Migration completed successfully! All collaborative task columns added.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ Columns already exist, skipping...');
    } else {
      throw error;
    }
  } finally {
    await db.end();
  }
}

run().catch(e => {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
});
