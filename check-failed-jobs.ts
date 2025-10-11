import { aiAnalysisQueue } from './src/backend/queue/queue.ts';

async function checkFailedJobs() {
  try {
    const failed = await aiAnalysisQueue.getFailed();
    console.log(`\n📊 Failed jobs: ${failed.length}\n`);
    
    if (failed.length > 0) {
      for (let i = 0; i < Math.min(failed.length, 3); i++) {
        const job = failed[i];
        console.log(`Job ${i + 1}:`);
        console.log(`  ID: ${job.id}`);
        console.log(`  Data:`, JSON.stringify(job.data, null, 2));
        console.log(`  Failed Reason: ${job.failedReason}`);
        console.log('');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFailedJobs();

