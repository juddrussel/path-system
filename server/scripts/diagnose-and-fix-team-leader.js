const mysql = require("mysql2/promise");
require("dotenv").config();

async function diagnoseAndFix() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  console.log("✅ Connected to database\n");

  // 1. Check the column definition
  const [columns] = await db.query(`
    SHOW COLUMNS FROM task_collaborators WHERE Field = 'role'
  `);
  console.log("Current 'role' column definition:");
  console.log(columns[0]);
  console.log("");

  // 2. Check if there's a default value causing issues
  console.log("Checking for default value or constraints...");
  const [createTable] = await db.query(`SHOW CREATE TABLE task_collaborators`);
  console.log(createTable[0]['Create Table']);
  console.log("");

  // 3. Try inserting 'team_leader' manually to test
  console.log("Testing manual insert of 'team_leader' role...");
  try {
    await db.query(`
      INSERT INTO task_collaborators (task_id, user_id, role, created_at)
      VALUES (99999, 1, 'team_leader', NOW())
    `);
    console.log("✅ Manual insert succeeded");
    
    // Clean up test row
    await db.query(`DELETE FROM task_collaborators WHERE task_id = 99999`);
  } catch (err) {
    console.log("❌ Manual insert failed:", err.message);
  }
  console.log("");

  // 4. Fix task 84 to have correct team leader
  console.log("Fixing task 84 - setting user_id 51 (Faculty M) as team_leader...");
  const [result] = await db.query(`
    UPDATE task_collaborators 
    SET role = 'team_leader'
    WHERE task_id = 84 AND user_id = 51
  `);
  console.log(`✅ Updated ${result.affectedRows} row(s)`);
  console.log("");

  // 5. Verify the fix
  const [verify] = await db.query(`
    SELECT tc.user_id, u.full_name, tc.role
    FROM task_collaborators tc
    JOIN users u ON u.id = tc.user_id
    WHERE tc.task_id = 84
    ORDER BY tc.role DESC
  `);
  console.log("Task 84 collaborators after fix:");
  console.table(verify);

  await db.end();
  console.log("\n✅ Done");
}

diagnoseAndFix().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
