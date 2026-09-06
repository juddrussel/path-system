require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_CA_CERT_PATH
      ? { ca: fs.readFileSync(path.resolve(process.env.DB_CA_CERT_PATH)), rejectUnauthorized: true }
      : undefined,
  });
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_task_archives (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      task_id    INT NOT NULL,
      archived_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_task (user_id, task_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('Done: user_task_archives table created');
  await db.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
