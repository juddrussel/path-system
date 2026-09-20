require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");

async function checkSLAStatus() {
  let conn;
  try {
    // SSL config for Aiven
    const sslConfig = process.env.DB_CA_CERT_PATH
      ? {
          ca: fs.readFileSync(process.env.DB_CA_CERT_PATH),
          rejectUnauthorized: true,
        }
      : undefined;

    conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: sslConfig,
    });

    console.log("✅ Database connected successfully!\n");

    // Query 1: Active SLA Rules
    console.log("=".repeat(80));
    console.log("QUERY 1: Active SLA Rules");
    console.log("=".repeat(80));
    try {
      const [slaRules] = await conn.query(
        "SELECT * FROM sla_rules WHERE status='Active' LIMIT 5;"
      );
      if (slaRules.length === 0) {
        console.log("⚠️  No active SLA rules found!");
      } else {
        console.log(`✅ Found ${slaRules.length} active SLA rule(s):\n`);
        console.table(slaRules);
      }
    } catch (err) {
      console.error("❌ Query error:", err.message);
    }

    console.log("\n");

    // Query 2: SLA Recipients
    console.log("=".repeat(80));
    console.log("QUERY 2: SLA Recipients");
    console.log("=".repeat(80));
    try {
      const [slaRecipients] = await conn.query(
        "SELECT * FROM sla_recipients;"
      );
      if (slaRecipients.length === 0) {
        console.log("⚠️  No SLA recipients found!");
      } else {
        console.log(`✅ Found ${slaRecipients.length} SLA recipient(s):\n`);
        console.table(slaRecipients);
      }
    } catch (err) {
      console.error("❌ Query error:", err.message);
    }

    console.log("\n");

    // Query 3: Tasks with approaching/overdue deadlines
    console.log("=".repeat(80));
    console.log("QUERY 3: Tasks with Deadlines");
    console.log("=".repeat(80));
    try {
      const [tasks] = await conn.query(
        "SELECT id, title, deadline, status FROM tasks WHERE deadline IS NOT NULL ORDER BY deadline DESC LIMIT 5;"
      );
      if (tasks.length === 0) {
        console.log("⚠️  No tasks with deadlines found!");
      } else {
        console.log(`✅ Found ${tasks.length} task(s) with deadlines:\n`);
        console.table(tasks);
      }
    } catch (err) {
      console.error("❌ Query error:", err.message);
    }

    console.log("\n");

    // Additional diagnostic queries
    console.log("=".repeat(80));
    console.log("DIAGNOSTIC: Table Structure & Record Counts");
    console.log("=".repeat(80));

    // Check table existence and row counts
    try {
      const [tables] = await conn.query(`
        SELECT 
          'sla_rules' as table_name, COUNT(*) as row_count 
        FROM sla_rules
        UNION ALL
        SELECT 'sla_recipients', COUNT(*) FROM sla_recipients
        UNION ALL
        SELECT 'tasks', COUNT(*) FROM tasks
        UNION ALL
        SELECT 'users', COUNT(*) FROM users;
      `);
      console.log("\nTable row counts:\n");
      console.table(tables);
    } catch (err) {
      console.error("❌ Diagnostic query error:", err.message);
    }

    await conn.end();
    console.log("\n✅ Check complete!");
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  }
}

checkSLAStatus();
