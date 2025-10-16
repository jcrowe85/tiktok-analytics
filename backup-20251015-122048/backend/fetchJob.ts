import dotenv from 'dotenv';
import { TikTokClient } from './tiktokClient.js';
import { enrichVideoWithKPIs, createSnapshot } from './kpis.js';
import { writeCSV, writeJSON, loadSnapshots, appendSnapshots } from './persist.js';
import { addVideoForAnalysis, addStaticContentForAnalysis } from './queue/queue.js';
import { executeQuery, upsertVideo } from './database/connection.js';

dotenv.config();

/**
 * Main ETL job: fetch videos, compute KPIs, persist data
 */
async function runFetchJob(): Promise<void> {
  console.log('\n🎯 TikTok Analytics Fetch Job\n');
  console.log('════════════════════════════════════════\n');

  try {
    // Get the most recent TikTok connection from database
    const users = await executeQuery(`
      SELECT id, tiktok_access_token, tiktok_refresh_token, tiktok_username, tiktok_token_expires_at
      FROM users 
      WHERE tiktok_access_token IS NOT NULL 
      ORDER BY tiktok_connected_at DESC 
      LIMIT 1
    `);

    if (!users || users.length === 0) {
      console.error('❌ Error: No TikTok connections found in database');
      console.error('   Please authenticate through the web interface first');
      process.exit(1);
    }

    const user = users[0];
    console.log(`🔗 Using TikTok connection for user: ${user.tiktok_username} (ID: ${user.id})`);

    // Check if token is expired
    const tokenExpired = user.tiktok_token_expires_at && new Date(user.tiktok_token_expires_at) < new Date();
    let accessToken = user.tiktok_access_token;
    let refreshToken = user.tiktok_refresh_token;

    if (tokenExpired) {
      console.log('🔄 Token expired, refreshing...');
      const { refreshAccessToken } = await import('./oauth.js');
      const tokens = await refreshAccessToken(refreshToken, user.id);
      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token;
    }

    // Initialize client with userId for proper token refresh
    const client = new TikTokClient(accessToken, refreshToken, user.id);

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
    console.log('🚩 Step 7: Persist data to database and files');
    
    // Save all videos to database
    for (const video of enrichedVideos) {
      await upsertVideo({
        id: video.id,
        username: video.username,
        caption: video.caption,
        video_description: video.video_description,
        hashtags: video.hashtags,
        posted_at_iso: video.posted_at_iso,
        create_time: video.create_time,
        duration: video.duration,
        view_count: video.view_count,
        like_count: video.like_count,
        comment_count: video.comment_count,
        share_count: video.share_count,
        engagement_rate: video.engagement_rate,
        like_rate: video.like_rate,
        comment_rate: video.comment_rate,
        share_rate: video.share_rate,
        views_24h: video.views_24h,
        velocity_24h: video.velocity_24h,
        share_url: video.share_url,
        embed_link: video.embed_link,
        cover_image_url: video.cover_image_url,
      });
    }
    console.log(`   ✅ Saved ${enrichedVideos.length} videos to database`);
    
    // Write backup files (optional)
    writeCSV(enrichedVideos);
    writeJSON(enrichedVideos);
    appendSnapshots(newSnapshots);

    // Queue new videos for AI analysis
    console.log('🚩 Step 8: Queue videos for AI analysis');
    let queuedCount = 0;
    let skippedCount = 0;
    let alreadyAnalyzedCount = 0;
    
    // Get list of videos that already have AI analysis
    const existingAnalyses = await executeQuery(
      'SELECT video_id FROM video_ai_analysis WHERE status = $1',
      ['completed']
    );
    const analyzedVideoIds = new Set(existingAnalyses.map(row => row.video_id));
    
    for (const video of enrichedVideos) {
      // Skip if already analyzed
      if (analyzedVideoIds.has(video.id)) {
        alreadyAnalyzedCount++;
        continue;
      }
      
      try {
        // Check if this is static content or carousel (duration = 0)
        if (video.duration === 0 || !video.duration) {
          // Queue for static content analysis
          await addStaticContentForAnalysis(video.id, video.caption, video.cover_image_url);
          console.log(`   📸 Queued static content ${video.id} for analysis`);
          queuedCount++;
        } else if (video.share_url) {
          // Queue for regular video analysis
          await addVideoForAnalysis(video.id, undefined, video.share_url);
          console.log(`   🎥 Queued video ${video.id} for analysis`);
          queuedCount++;
        } else {
          console.log(`   ⚠️  Skipping video ${video.id}: No share_url available`);
          skippedCount++;
        }
      } catch (error) {
        console.log(`   ⚠️  Failed to queue video ${video.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        skippedCount++;
      }
    }
    
    console.log(`   ✅ Queued ${queuedCount} new videos for AI analysis`);
    if (alreadyAnalyzedCount > 0) {
      console.log(`   ℹ️  Skipped ${alreadyAnalyzedCount} videos (already analyzed)`);
    }
    if (skippedCount > 0) {
      console.log(`   ⚠️  Skipped ${skippedCount} videos (missing share_url or queue errors)`);
    }

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
    console.log(`   AI Analysis Queued: ${queuedCount} videos`);

    console.log('\n✅ Fetch job complete!');
    console.log('   📊 Data saved to data/data.json and data/videos.csv');
    console.log('   🤖 AI analysis jobs queued and processing in background');
    console.log('   🌐 Run "npm run dev" to view the dashboard\n');

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

