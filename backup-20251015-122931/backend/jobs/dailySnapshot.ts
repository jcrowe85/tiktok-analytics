/**
 * Daily Snapshot Job
 * 
 * Runs daily to capture current video metrics for all users.
 * This enables accurate growth tracking over time.
 * 
 * Should be scheduled to run at midnight (or early morning) each day.
 */

import { takeAllSnapshots } from '../services/snapshotService.js';
import { testDatabaseConnection } from '../database/connection.js';

async function runDailySnapshot() {
  console.log('🚀 Starting daily snapshot job...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  try {
    // Ensure database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Take snapshots
    await takeAllSnapshots();
    
    console.log('✅ Daily snapshot job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Daily snapshot job failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailySnapshot();
}

export { runDailySnapshot };

