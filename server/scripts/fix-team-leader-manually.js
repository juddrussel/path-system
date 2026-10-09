/**
 * Manually fix team leader for specific tasks
 * Run this to assign the correct team leader based on task ID
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

async function fixTeamLeader() {
  let connection;
  
  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✓ Connected");

    // Get the most recent collaborative tasks
    const [tasks] = await connection.query(`
      SELECT id FROM tasks ORDER BY id DESC LIMIT 10
    `);
    
    const taskIds = tasks.map(t => t.id);
    
    if (taskIds.length === 0) {
      console.log("No tasks found");
      return;
    }
    
    const [recentTasks] = await connection.query(`
      SELECT DISTINCT tc.task_id, 
             GROUP_CONCAT(tc.user_id ORDER BY tc.id ASC) as user_ids,
             GROUP_CONCAT(u.full_name ORDER BY tc.id ASC) as names
      FROM task_collaborators tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id IN (?)
      GROUP BY tc.task_id
      ORDER BY tc.task_id DESC
    `, [taskIds]);

    console.log("\nRecent tasks:");
    recentTasks.forEach(t => {
      console.log(`Task ${t.task_id}: ${t.names} (IDs: ${t.user_ids})`);
    });

    console.log("\nWhich task ID should we fix? (Enter task ID)");
    console.log("The FIRST user in each task will be set as team leader.");
    console.log("\nFor now, setting first user as team leader for all recent tasks...\n");

    for (const task of recentTasks) {
      const userIds = task.user_ids.split(',').map(id => parseInt(id));
      const names = task.names.split(',');
      const teamLeaderId = userIds[0];
      
      // Set first user as team leader
      await connection.query(`
        UPDATE task_collaborators 
        SET role = 'team_leader' 
        WHERE task_id = ? AND user_id = ?
      `, [task.task_id, teamLeaderId]);
      
      // Set others as contributors
      for (let i = 1; i < userIds.length; i++) {
        await connection.query(`
          UPDATE task_collaborators 
          SET role = 'contributor' 
          WHERE task_id = ? AND user_id = ?
        `, [task.task_id, userIds[i]]);
      }
      
      console.log(`✓ Task ${task.task_id}: Set ${names[0]} (ID ${teamLeaderId}) as team leader`);
    }

    console.log("\n✅ Done! Refresh the task pages to see the changes.");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (connection) await connection.end();
  }
}

fixTeamLeader();
