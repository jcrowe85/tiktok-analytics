import dotenv from 'dotenv';
import { TikTokClient } from './tiktokClient.js';
import { enrichVideoWithKPIs, createSnapshot } from './kpis.js';
import { writeCSV, writeJSON, loadSnapshots, appendSnapshots } from './persist.js';

dotenv.config();

/**
 * Main ETL job: fetch videos, compute KPIs, persist data
 */
async function runFetchJob(): Promise<void> {
  console.log('\n🎯 TikTok Analytics Fetch Job\n');
  console.log('════════════════════════════════════════\n');

  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;

  if (!accessToken || !refreshToken) {
    console.error('❌ Error: Missing access tokens');
    console.error('   Run "npm run auth" first to authenticate with TikTok');
    process.exit(1);
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
    console.log('   Run "npm run dev" to view the dashboard\n');

  } catch (error) {
    console.error('\n❌ Fetch job failed:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFetchJob();
}

