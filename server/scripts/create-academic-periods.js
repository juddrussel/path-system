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
  await db.execute(`
    CREATE TABLE IF NOT EXISTS academic_periods (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      semester      ENUM('1st Semester','2nd Semester','Summer') NOT NULL,
      academic_year VARCHAR(20) NOT NULL,
      start_date    DATE NOT NULL,
      end_date      DATE NOT NULL,
      is_active     TINYINT(1) NOT NULL DEFAULT 0,
      created_by    INT DEFAULT NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('Done: academic_periods table created');
  await db.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
