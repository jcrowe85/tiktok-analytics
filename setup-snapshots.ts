/**
 * One-time setup script for snapshot system
 * 
 * This script:
 * 1. Runs the database migration to create video_snapshots table
 * 2. Creates an initial baseline snapshot for all existing videos
 */

import { readFileSync } from 'fs';
import { executeQuery, testDatabaseConnection } from './src/backend/database/connection.js';
import { backfillInitialSnapshot } from './src/backend/services/snapshotService.js';

async function setupSnapshots() {
  console.log('🚀 Setting up snapshot system...\n');
  
  try {
    // 1. Test database connection
    console.log('📡 Testing database connection...');
    const connected = await testDatabaseConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connected\n');
    
    // 2. Run migration
    console.log('📋 Running migration 003_add_video_snapshots.sql...');
    const migration = readFileSync('./database/migrations/003_add_video_snapshots.sql', 'utf8');
    await executeQuery(migration);
    console.log('✅ Migration completed\n');
    
    // 3. Create initial baseline snapshot
    console.log('📸 Creating initial baseline snapshot...');
    await backfillInitialSnapshot();
    console.log('✅ Baseline snapshot created\n');
    
    console.log('🎉 Snapshot system setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   - Daily snapshots will now track growth over time');
    console.log('   - Run "npm run snapshot" daily (ideally via cron job)');
    console.log('   - Growth metrics will be available via /api/growth/:period endpoint');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupSnapshots();

