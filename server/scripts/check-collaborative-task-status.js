const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkCollaborativeTaskStatus() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  console.log("✅ Connected to database\n");

  // Get all collaborative tasks
  const [tasks] = await db.query(`
    SELECT 
      t.id,
      t.title,
      t.status,
      t.confirmation_status,
      t.current_output_version,
      t.submitted_at,
      t.is_collaborative,
      t.collaboration_mode
    FROM tasks t
    WHERE t.is_collaborative = 1
    ORDER BY t.id DESC
    LIMIT 20
  `);

  console.log(`Found ${tasks.length} collaborative tasks:\n`);
  
  for (const task of tasks) {
    console.log(`Task ID: ${task.id}`);
    console.log(`  Title: ${task.title}`);
    console.log(`  Status: ${task.status}`);
    console.log(`  Confirmation Status: ${task.confirmation_status || 'NULL'}`);
    console.log(`  Current Version: ${task.current_output_version || 0}`);
    console.log(`  Submitted At: ${task.submitted_at || 'NULL'}`);
    console.log(`  Collaboration Mode: ${task.collaboration_mode}`);
    
    // Get collaborators
    const [collaborators] = await db.query(`
      SELECT 
        tc.user_id,
        tc.role,
        u.full_name,
        u.email
      FROM task_collaborators tc
      JOIN users u ON u.id = tc.user_id
      WHERE tc.task_id = ?
    `, [task.id]);
    
    console.log(`  Collaborators (${collaborators.length}):`);
    collaborators.forEach(c => {
      console.log(`    - ${c.full_name} (${c.email}) - Role: ${c.role}`);
    });
    
    // Get confirmations
    if (task.current_output_version > 0) {
      const [confirmations] = await db.query(`
        SELECT 
          tc.user_id,
          tc.status,
          tc.confirmed_at,
          u.full_name
        FROM task_confirmations tc
        JOIN users u ON u.id = tc.user_id
        WHERE tc.task_id = ? AND tc.output_version = ?
      `, [task.id, task.current_output_version]);
      
      console.log(`  Confirmations for v${task.current_output_version} (${confirmations.length}):`);
      confirmations.forEach(c => {
        console.log(`    - ${c.full_name}: ${c.status} at ${c.confirmed_at || 'NULL'}`);
      });
    }
    
    console.log('');
  }

  await db.end();
  console.log("✅ Done");
}

checkCollaborativeTaskStatus().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
