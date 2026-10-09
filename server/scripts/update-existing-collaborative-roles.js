/**
 * Migration Script: Update Existing Collaborative Task Roles
 * 
 * This script updates existing task_collaborators records to assign
 * the 'team_leader' role to the first collaborator (lowest ID)
 * and 'contributor' role to all others.
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

async function updateExistingRoles() {
  let connection;
  
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✓ Connected to database");

    // Get all collaborative tasks
    console.log("\nFinding all collaborative tasks...");
    const [tasks] = await connection.query(`
      SELECT DISTINCT task_id 
      FROM task_collaborators 
      ORDER BY task_id
    `);
    
    console.log(`Found ${tasks.length} tasks with collaborators`);

    let updatedCount = 0;
    let skippedCount = 0;

    // For each task, set the first collaborator as team leader
    for (const { task_id } of tasks) {
      // Get all collaborators for this task, ordered by ID (earliest = team leader)
      const [collaborators] = await connection.query(`
        SELECT id, user_id, role
        FROM task_collaborators 
        WHERE task_id = ?
        ORDER BY id ASC
      `, [task_id]);

      if (collaborators.length === 0) continue;

      // Check if roles are already set
      const hasRoles = collaborators.some(c => c.role && c.role !== 'contributor');
      
      if (hasRoles) {
        console.log(`Task ${task_id}: Already has roles assigned, skipping`);
        skippedCount++;
        continue;
      }

      // First collaborator becomes team leader
      const teamLeader = collaborators[0];
      await connection.query(`
        UPDATE task_collaborators 
        SET role = 'team_leader' 
        WHERE id = ?
      `, [teamLeader.id]);

      // Rest become contributors (if not already)
      for (let i = 1; i < collaborators.length; i++) {
        await connection.query(`
          UPDATE task_collaborators 
          SET role = 'contributor' 
          WHERE id = ?
        `, [collaborators[i].id]);
      }

      console.log(`Task ${task_id}: Set user ${teamLeader.user_id} as team leader, ${collaborators.length - 1} as contributors`);
      updatedCount++;
    }

    console.log("\n" + "=".repeat(60));
    console.log("Migration Complete!");
    console.log("=".repeat(60));
    console.log(`✓ Updated: ${updatedCount} tasks`);
    console.log(`- Skipped: ${skippedCount} tasks (already had roles)`);
    console.log(`Total tasks processed: ${tasks.length}`);

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n✓ Database connection closed");
    }
  }
}

// Run the migration
updateExistingRoles()
  .then(() => {
    console.log("\n✓ Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Migration script failed:", error);
    process.exit(1);
  });
