/**
 * Fix role column size to accommodate 'team_leader'
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
};

async function fixRoleColumn() {
  let connection;
  
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✓ Connected to database");

    console.log("\nChecking current role column definition...");
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM task_collaborators LIKE 'role'
    `);
    
    console.log("Current definition:", columns[0]);

    console.log("\nExpanding role column to VARCHAR(50)...");
    await connection.query(`
      ALTER TABLE task_collaborators 
      MODIFY COLUMN role VARCHAR(50) DEFAULT 'contributor'
    `);
    
    console.log("✓ Column updated successfully");

    // Verify the change
    const [newColumns] = await connection.query(`
      SHOW COLUMNS FROM task_collaborators LIKE 'role'
    `);
    
    console.log("New definition:", newColumns[0]);

  } catch (error) {
    console.error("Fix failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n✓ Database connection closed");
    }
  }
}

fixRoleColumn()
  .then(() => {
    console.log("\n✓ Column fix completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Column fix failed:", error);
    process.exit(1);
  });
