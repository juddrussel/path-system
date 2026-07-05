require("dotenv").config();
const mysql = require("mysql2/promise");

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log("✅ Database connected successfully!");
    await conn.end();
  } catch (err) {
    console.error("❌ DB Connection failed:", err.message);
  }
}

test();