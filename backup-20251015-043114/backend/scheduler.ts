import cron from 'node-cron';
import dotenv from 'dotenv';
import { TikTokClient } from './tiktokClient.js';
import { enrichVideoWithKPIs, createSnapshot } from './kpis.js';
import { writeCSV, writeJSON, loadSnapshots, appendSnapshots } from './persist.js';

dotenv.config();

// Import the fetch job logic directly
async function runFetchJob(): Promise<void> {
  console.log('\n🎯 TikTok Analytics Fetch Job\n');
  console.log('════════════════════════════════════════\n');

  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;

  if (!accessToken || !refreshToken) {
    console.error('❌ Error: Missing access tokens');
    console.error('   Run "npm run auth" first to authenticate with TikTok');
    throw new Error('Missing access tokens');
  }

  try {
    // Initialize client
    const client = new TikTokClient(accessToken, refreshToken);

    // Get user info (username)
    console.log('🚩 Step 3: Fetch user info');
    const userInfo = await client.getUserInfo();
    console.log(`   ✅ Username: @${userInfo.username}`);

    // Fetch all videos
    const videos = await client.getAllVideos();

    if (videos.length === 0) {
      console.log('\n⚠️  No videos found. Nothing to process.');
      return;
    }

    // Load previous snapshots for velocity calculation
    console.log('🚩 Step 6: Compute KPIs & velocities');
    const previousSnapshots = loadSnapshots();
    console.log(`   📊 Loaded ${previousSnapshots.length} previous snapshots`);

    // Enrich videos with KPIs
    const enrichedVideos = videos.map(video => 
      enrichVideoWithKPIs(video, previousSnapshots)
    );

    // Create new snapshots for next run
    const newSnapshots = videos.map(createSnapshot);
    
    // Persist data
    writeCSV(enrichedVideos);
    writeJSON(enrichedVideos);
    appendSnapshots(newSnapshots);

    // Summary stats
    console.log('\n📊 Summary Statistics');
    console.log('════════════════════════════════════════');
    
    const totalViews = enrichedVideos.reduce((sum, v) => sum + v.view_count, 0);
    const totalLikes = enrichedVideos.reduce((sum, v) => sum + v.like_count, 0);
    const totalComments = enrichedVideos.reduce((sum, v) => sum + v.comment_count, 0);
    const totalShares = enrichedVideos.reduce((sum, v) => sum + v.share_count, 0);
    
    const engagementRates = enrichedVideos.map(v => v.engagement_rate).sort((a, b) => a - b);
    const medianER = engagementRates[Math.floor(engagementRates.length / 2)] || 0;

    console.log(`   Videos: ${enrichedVideos.length}`);
    console.log(`   Total Views: ${totalViews.toLocaleString()}`);
    console.log(`   Total Likes: ${totalLikes.toLocaleString()}`);
    console.log(`   Total Comments: ${totalComments.toLocaleString()}`);
    console.log(`   Total Shares: ${totalShares.toLocaleString()}`);
    console.log(`   Median Engagement Rate: ${(medianER * 100).toFixed(2)}%`);

    console.log('\n✅ Fetch job complete!');

  } catch (error) {
    console.error('\n❌ Fetch job failed:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * TikTok Analytics Scheduler
 * Runs fetch jobs on a schedule
 */
class AnalyticsScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Schedule daily fetch job at 9:00 AM
   */
  scheduleDailyFetch(): void {
    const jobName = 'daily-fetch';
    
    if (this.jobs.has(jobName)) {
      console.log('⚠️  Daily fetch job already scheduled');
      return;
    }

    const job = cron.schedule('0 9 * * *', async () => {
      console.log('\n🕐 Running scheduled fetch job...');
      try {
        await runFetchJob();
        console.log('✅ Scheduled fetch job completed successfully');
      } catch (error) {
        console.error('❌ Scheduled fetch job failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/New_York' // Adjust to your timezone
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log('✅ Daily fetch job scheduled for 9:00 AM');
  }

  /**
   * Schedule hourly fetch job (for testing)
   */
  scheduleHourlyFetch(): void {
    const jobName = 'hourly-fetch';
    
    if (this.jobs.has(jobName)) {
      console.log('⚠️  Hourly fetch job already scheduled');
      return;
    }

    const job = cron.schedule('0 * * * *', async () => {
      console.log('\n🕐 Running hourly fetch job...');
      try {
        await runFetchJob();
        console.log('✅ Hourly fetch job completed successfully');
      } catch (error) {
        console.error('❌ Hourly fetch job failed:', error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set(jobName, job);
    job.start();
    
    console.log('✅ Hourly fetch job scheduled');
  }

  /**
   * Stop a scheduled job
   */
  stopJob(jobName: string): void {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`✅ Stopped job: ${jobName}`);
    } else {
      console.log(`⚠️  Job not found: ${jobName}`);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs(): void {
    for (const [jobName, job] of this.jobs) {
      job.stop();
      console.log(`✅ Stopped job: ${jobName}`);
    }
    this.jobs.clear();
  }

  /**
   * List all active jobs
   */
  listJobs(): void {
    console.log('\n📋 Active Scheduled Jobs:');
    console.log('========================');
    
    if (this.jobs.size === 0) {
      console.log('   No active jobs');
      return;
    }

    for (const jobName of this.jobs.keys()) {
      console.log(`   ✅ ${jobName}`);
    }
  }
}

// Export singleton instance
export const scheduler = new AnalyticsScheduler();

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'start-daily':
      scheduler.scheduleDailyFetch();
      break;
    case 'start-hourly':
      scheduler.scheduleHourlyFetch();
      break;
    case 'stop':
      const jobName = process.argv[3];
      if (jobName) {
        scheduler.stopJob(jobName);
      } else {
        scheduler.stopAllJobs();
      }
      break;
    case 'list':
      scheduler.listJobs();
      break;
    default:
      console.log('🕐 TikTok Analytics Scheduler');
      console.log('============================');
      console.log('');
      console.log('Usage:');
      console.log('  npm run scheduler start-daily   # Schedule daily fetch at 9 AM');
      console.log('  npm run scheduler start-hourly  # Schedule hourly fetch (testing)');
      console.log('  npm run scheduler stop [job]    # Stop specific job or all jobs');
      console.log('  npm run scheduler list          # List active jobs');
      break;
  }
}
