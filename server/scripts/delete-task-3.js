const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function deleteTask3() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log('🗑️  Starting deletion of Task ID 3...\n');

    // Start transaction
    await connection.beginTransaction();

    // 1. Check if task exists and get info
    const [taskInfo] = await connection.query(
      'SELECT id, title, is_collaborative FROM tasks WHERE id = 3'
    );

    if (taskInfo.length === 0) {
      console.log('❌ Task ID 3 not found in database.');
      await connection.rollback();
      return;
    }

    console.log(`📋 Task found: "${taskInfo[0].title}"`);
    console.log(`   Is Collaborative: ${taskInfo[0].is_collaborative ? 'Yes' : 'No'}\n`);

    // 2. Delete related records in order (respecting foreign keys)
    
    // Delete collaborative task messages (and their replies via CASCADE)
    const [msgResult] = await connection.query(
      'DELETE FROM collaborative_task_messages WHERE task_id = 3'
    );
    console.log(`✓ Deleted ${msgResult.affectedRows} collaborative messages (+ replies via CASCADE)`);

    // Delete collaborative task confirmations
    const [confResult] = await connection.query(
      'DELETE FROM collaborative_task_confirmations WHERE task_id = 3'
    );
    console.log(`✓ Deleted ${confResult.affectedRows} collaborative confirmations`);

    // Delete collaborative task collaborators
    const [collabResult] = await connection.query(
      'DELETE FROM collaborative_task_collaborators WHERE task_id = 3'
    );
    console.log(`✓ Deleted ${collabResult.affectedRows} collaborators`);

    // Delete task history
    const [histResult] = await connection.query(
      'DELETE FROM task_history WHERE task_id = 3'
    );
    console.log(`✓ Deleted ${histResult.affectedRows} history records`);

    // Delete task changelog
    const [changelogResult] = await connection.query(
      'DELETE FROM task_changelog WHERE task_id = 3'
    );
    console.log(`✓ Deleted ${changelogResult.affectedRows} changelog records`);

    // Delete task versions
    const [versionResult] = await connection.query(
      'DELETE FROM task_versions WHERE task_id = 3'
    );
    console.log(`✓ Deleted ${versionResult.affectedRows} task versions`);

    // Delete task attachments
    const [attachResult] = await connection.query(
      'DELETE FROM task_attachments WHERE task_id = 3'
    );
    console.log(`✓ Deleted ${attachResult.affectedRows} task attachments`);

    // Delete notifications related to this task
    const [notifResult] = await connection.query(
      'DELETE FROM notifications WHERE task_id = 3'
    );
    console.log(`✓ Deleted ${notifResult.affectedRows} notifications`);

    // Delete audit logs for this task
    const [auditResult] = await connection.query(
      'DELETE FROM audit_logs WHERE entity_type = ? AND entity_id = ?',
      ['task', 3]
    );
    console.log(`✓ Deleted ${auditResult.affectedRows} audit log entries`);

    // Finally, delete the task itself
    const [taskResult] = await connection.query(
      'DELETE FROM tasks WHERE id = 3'
    );
    console.log(`✓ Deleted the task itself\n`);

    // Commit transaction
    await connection.commit();
    console.log('✅ Task ID 3 and all related data successfully deleted!');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error deleting task:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

deleteTask3()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
