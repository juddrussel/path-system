const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');
const { recalculateAllScores } = require('../services/facultyScoreService');

async function main() {
  console.log('🔄 Recalculating faculty scores...\n');
  
  try {
    const result = await recalculateAllScores(db, { keepHistory: false });
    console.log('✅ Faculty scores recalculated successfully!');
    console.log(`   Updated: ${result.updated} faculty members`);
    console.log(`   Time: ${result.updatedAt}\n`);
    
    // Show the new scores
    const [users] = await db.query(
      `SELECT full_name, performance_score, active_count, completed_count, pending_count, overdue_count
       FROM users 
       WHERE role = 'faculty' AND status = 'approved' AND is_active = 1
       ORDER BY full_name`
    );
    
    console.log('📊 Updated Scores:');
    console.log('─'.repeat(80));
    users.forEach(u => {
      console.log(`${u.full_name.padEnd(30)} Score: ${String(u.performance_score || 0).padStart(3)}%  ` +
                  `Active: ${u.active_count || 0}  Completed: ${u.completed_count || 0}  ` +
                  `Pending: ${u.pending_count || 0}  Overdue: ${u.overdue_count || 0}`);
    });
    console.log('─'.repeat(80));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
