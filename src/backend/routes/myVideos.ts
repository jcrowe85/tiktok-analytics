import express from 'express';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../database/connection.js';
import { TikTokClient } from '../tiktokClient.js';
import { refreshAccessToken } from '../oauth.js';

const router = express.Router();

/**
 * Get user's TikTok videos with freemium limits
 */
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Get user's TikTok connection and plan info
    const userResult = await executeQuery(`
      SELECT 
        tiktok_access_token,
        tiktok_refresh_token,
        tiktok_username,
        tiktok_display_name,
        tiktok_token_expires_at,
        plan_type,
        videos_allowed
      FROM users 
      WHERE id = $1
    `, [userId]) as any;

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Check if TikTok is connected
    if (!user.tiktok_access_token) {
      return res.status(400).json({ 
        error: 'TikTok account not connected',
        connected: false 
      });
    }

    // Check if token is expired
    const tokenExpired = user.tiktok_token_expires_at && new Date(user.tiktok_token_expires_at) < new Date();
    let accessToken = user.tiktok_access_token;
    let refreshToken = user.tiktok_refresh_token;

    if (tokenExpired) {
      try {
        console.log('🔄 Refreshing expired TikTok token for user:', userId);
        const tokens = await refreshAccessToken(refreshToken);
        
        // Update tokens in database
        await executeQuery(`
          UPDATE users 
          SET 
            tiktok_access_token = $1,
            tiktok_refresh_token = $2,
            tiktok_token_expires_at = $3
          WHERE id = $4
        `, [
          tokens.access_token,
          tokens.refresh_token,
          new Date(Date.now() + (tokens.expires_in * 1000)),
          userId
        ]);

        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
      } catch (refreshError) {
        console.error('❌ Failed to refresh TikTok token:', refreshError);
        return res.status(401).json({ 
          error: 'TikTok token expired and could not be refreshed',
          connected: false 
        });
      }
    }

    try {
      // First, check if we have videos in the database
      const existingVideos = await executeQuery(`
        SELECT COUNT(*) as count FROM videos WHERE user_id = $1
      `, [userId]) as any;
      
      const hasVideos = existingVideos[0]?.count > 0;
      
      // Only fetch from TikTok API if database is empty
      if (!hasVideos) {
        console.log('📥 No videos in database, fetching from TikTok API...');
        const tiktokClient = new TikTokClient(accessToken, refreshToken);
        const allVideos = await tiktokClient.getAllVideos();
        
        console.log(`💾 Storing ${allVideos.length} videos in database...`);
        
        // Store videos in database
        for (const video of allVideos) {
        await executeQuery(`
          INSERT INTO videos (
            id, user_id, username, view_count, like_count, comment_count, 
            share_count, duration, video_description, cover_image_url, share_url, 
            create_time, posted_at_iso, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            username = EXCLUDED.username,
            view_count = EXCLUDED.view_count,
            like_count = EXCLUDED.like_count,
            comment_count = EXCLUDED.comment_count,
            share_count = EXCLUDED.share_count,
            create_time = EXCLUDED.create_time,
            posted_at_iso = EXCLUDED.posted_at_iso,
            updated_at = NOW()
        `, [
          video.id,
          userId,
          user.tiktok_username,
          video.view_count,
          video.like_count,
          video.comment_count,
          video.share_count,
          video.duration,
          video.video_description,
          video.cover_image_url,
          video.share_url,
          video.create_time,
          new Date(video.create_time * 1000).toISOString()
        ]);
        }
        console.log(`✅ Stored ${allVideos.length} videos in database`);
      } else {
        console.log('📂 Loading videos from database (avoiding TikTok API rate limits)');
      }

      // Fetch all videos from database
      const dbVideos = await executeQuery(`
        SELECT 
          id, view_count, like_count, comment_count, share_count, 
          duration, video_description, cover_image_url, share_url, 
          create_time, posted_at_iso, created_at, updated_at
        FROM videos 
        WHERE user_id = $1 AND is_adhoc = false
        ORDER BY posted_at_iso DESC NULLS LAST, created_at DESC
      `, [userId]) as any;
      
      const videosToShow = dbVideos;
      const totalVideos = dbVideos.length;

        // Get existing analytics for videos that have been analyzed
        const analyzedVideoIds = videosToShow.map((v: any) => v.id);
        let existingAnalytics: any[] = [];
        console.log('🔍 Debug: analyzedVideoIds:', analyzedVideoIds);

        if (analyzedVideoIds.length > 0) {
          const analyticsResult = await executeQuery(`
            SELECT 
              v.id,
              v.view_count,
              v.like_count,
              v.comment_count,
              v.share_count,
              v.duration,
              v.video_description,
              v.cover_image_url,
              v.share_url,
              v.create_time,
              v.posted_at_iso,
              v.created_at,
              v.updated_at,
              ai.status as ai_status,
              ai.updated_at as ai_updated_at,
              ai.scores,
              ai.visual_scores,
              ai.findings,
              ai.fix_suggestions,
              ai.artifacts,
              ai.processed_at as ai_processed_at
            FROM videos v
            LEFT JOIN video_ai_analysis ai ON v.id = ai.video_id
            WHERE v.id = ANY($1) AND v.user_id = $2
            ORDER BY v.posted_at_iso DESC NULLS LAST, v.created_at DESC
          `, [analyzedVideoIds, userId]) as any;

          console.log('🔍 Debug: analyticsResult type:', typeof analyticsResult, Array.isArray(analyticsResult));
          console.log('🔍 Debug: analyticsResult length:', analyticsResult?.length);
          
          // executeQuery returns an array directly, not {rows: [...]}
          existingAnalytics = Array.isArray(analyticsResult) ? analyticsResult : [];
          console.log('🔍 Debug: existingAnalytics after assignment:', existingAnalytics.length);
          if (existingAnalytics.length > 0) {
            console.log('🔍 Debug: first analytics:', JSON.stringify(existingAnalytics[0], null, 2));
          }
        }

      // Merge TikTok data with existing analytics
      console.log('🔍 Debug: videosToShow length:', videosToShow?.length);
      console.log('🔍 Debug: existingAnalytics length:', existingAnalytics?.length);
      
      const mergedVideos = videosToShow.map((video: any) => {
        const existing = existingAnalytics.find(a => a.id === video.id);
        
        if (existing) {
          // Return existing data from database - map DB fields to frontend expectations
          return {
            ...existing,
            username: user.tiktok_username,
            ai_scores: existing.scores,
            ai_visual_scores: existing.visual_scores,
            ai_findings: existing.findings,
            ai_fix_suggestions: existing.fix_suggestions,
          };
        } else {
          // Return fresh TikTok data
          return {
            ...video,
            username: user.tiktok_username,
            ai_status: null,
            ai_updated_at: null,
            ai_processed_at: null,
          };
        }
      });

      res.json({
        videos: mergedVideos,
        totalVideos,
        connected: true,
        username: user.tiktok_username,
        displayName: user.tiktok_display_name
      });

    } catch (tiktokError) {
      console.error('❌ Error fetching TikTok videos:', tiktokError);
      res.status(500).json({ 
        error: 'Failed to fetch TikTok videos',
        connected: true 
      });
    }

  } catch (error) {
    console.error('❌ Error in /my-videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Trigger analysis for user's videos (respects freemium limits)
 */
router.post('/analyze', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Get user's plan info
    const userResult = await executeQuery(`
      SELECT videos_allowed, plan_type
      FROM users 
      WHERE id = $1
    `, [userId]) as any;

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const videosAllowed = userResult[0].videos_allowed || 10;

    // Count how many videos user has already analyzed
    const analyzedCountResult = await executeQuery(`
      SELECT COUNT(*) as count
      FROM videos 
      WHERE user_id = $1
    `, [userId]) as any;

    const analyzedCount = parseInt(analyzedCountResult[0].count);

    if (analyzedCount >= videosAllowed) {
      return res.status(402).json({ 
        error: 'Video analysis limit reached',
        message: `You can analyze up to ${videosAllowed} videos with your current plan. Upgrade to analyze more videos.`,
        analyzedCount,
        videosAllowed,
        planType: userResult[0].plan_type
      });
    }

    // Get user's TikTok connection
    const tiktokResult = await executeQuery(`
      SELECT tiktok_access_token, tiktok_refresh_token, tiktok_username
      FROM users 
      WHERE id = $1
    `, [userId]) as any;

    if (!tiktokResult || tiktokResult.length === 0 || !tiktokResult[0].tiktok_access_token) {
      return res.status(400).json({ error: 'TikTok account not connected' });
    }

    const tiktokClient = new TikTokClient(
      tiktokResult[0].tiktok_access_token,
      tiktokResult[0].tiktok_refresh_token
    );

    // Fetch videos and start analysis for the remaining allowed videos
    const allVideos = await tiktokClient.getAllVideos();
    const videosToAnalyze = allVideos.slice(analyzedCount, videosAllowed);

    if (videosToAnalyze.length === 0) {
      return res.json({ 
        message: 'No new videos to analyze within your plan limits',
        analyzedCount,
        videosAllowed
      });
    }

    // Store videos in database and queue for analysis
    for (const video of videosToAnalyze) {
      await executeQuery(`
        INSERT INTO videos (
          id, user_id, username, view_count, like_count, comment_count, 
          share_count, duration, video_description, cover_image_url, share_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (id, user_id) DO UPDATE SET
          view_count = EXCLUDED.view_count,
          like_count = EXCLUDED.like_count,
          comment_count = EXCLUDED.comment_count,
          share_count = EXCLUDED.share_count,
          updated_at = NOW()
      `, [
        video.id,
        userId,
        video.username || tiktokResult[0].tiktok_username,
        video.view_count,
        video.like_count,
        video.comment_count,
        video.share_count,
        video.duration,
        video.video_description,
        video.cover_image_url,
        video.share_url
      ]);

      // Queue for AI analysis
      const { addVideoForAnalysis } = await import('../queue/queue.js');
      await addVideoForAnalysis(video.id, userId);
    }

    res.json({
      message: `Queued ${videosToAnalyze.length} videos for analysis`,
      analyzedCount: analyzedCount + videosToAnalyze.length,
      videosAllowed,
      remainingVideos: Math.max(0, allVideos.length - (analyzedCount + videosToAnalyze.length))
    });

  } catch (error) {
    console.error('❌ Error in /my-videos/analyze:', error);
    res.status(500).json({ error: 'Failed to start video analysis' });
  }
});

/**
 * Analyze a single video
 */
router.post('/analyze-single', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Get video data from database
    const videoResult = await executeQuery(`
      SELECT id, video_description, share_url, cover_image_url
      FROM videos 
      WHERE id = $1 AND user_id = $2
    `, [videoId, userId]) as any;

    if (!videoResult || videoResult.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videoResult[0];

    // Queue for AI analysis using full video pipeline
    // The share_url will be used to stream and download the video via RapidAPI
    const { addVideoForAnalysis } = await import('../queue/queue.js');
    await addVideoForAnalysis(videoId, userId, video.share_url);

    res.json({ 
      message: 'Video queued for analysis',
      videoId: videoId
    });

  } catch (error) {
    console.error('❌ Error in /my-videos/analyze-single:', error);
    res.status(500).json({ error: 'Failed to queue video for analysis' });
  }
});

/**
 * Analyze multiple videos in bulk
 */
router.post('/analyze-bulk', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { videoIds } = req.body;
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }

    // Get video data from database
    const videosResult = await executeQuery(`
      SELECT id, share_url
      FROM videos 
      WHERE id = ANY($1) AND user_id = $2
    `, [videoIds, userId]) as any;

    const videos = Array.isArray(videosResult) ? videosResult : [];
    
    if (videos.length === 0) {
      return res.status(404).json({ error: 'No videos found' });
    }

    // Queue all videos for analysis using full video pipeline
    const { addVideoForAnalysis } = await import('../queue/queue.js');
    
    console.log(`📝 Queueing ${videos.length} videos for analysis`);
    for (const video of videos) {
      console.log(`  → Queueing video: ${video.id}`);
      await addVideoForAnalysis(video.id, userId, video.share_url);
      console.log(`  ✅ Queued: ${video.id}`);
    }

    console.log(`✅ All ${videos.length} videos queued successfully`);
    
    res.json({ 
      message: `${videoIds.length} videos queued for analysis`,
      videoIds: videoIds
    });

  } catch (error) {
    console.error('❌ Error in /my-videos/analyze-bulk:', error);
    res.status(500).json({ error: 'Failed to queue videos for analysis' });
  }
});

/**
 * Analyze a single video
 * POST /api/my-videos/analyze-single
 */
router.post('/analyze-single', async (req, res) => {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { videoId } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    console.log(`🚩 Step 1: Starting single video analysis for user ${userId}, video ${videoId}`);

    // Get video data from database
    const videoResult = await executeQuery(`
      SELECT id, share_url, video_description, view_count, like_count, comment_count, share_count
      FROM videos 
      WHERE id = $1 AND user_id = $2
    `, [videoId, userId]) as any;

    if (videoResult.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = videoResult[0];
    console.log(`📊 Video found: ${video.id}, share_url: ${video.share_url}`);

    // Queue the analysis job
    const analysisQueue = new BullMQ.Queue('ai-analysis', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }
    });

    await analysisQueue.add('video-analysis', {
      videoId: video.id,
      shareUrl: video.share_url,
      userId: userId,
      type: 'video'
    });

    console.log(`✅ Queued video analysis for ${videoId}`);

    res.json({ success: true, message: 'Analysis started' });

  } catch (error) {
    console.error('❌ Error starting single video analysis:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

/**
 * Analyze multiple videos
 * POST /api/my-videos/analyze-bulk
 */
router.post('/analyze-bulk', async (req, res) => {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { videoIds } = req.body;
    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }

    console.log(`🚩 Step 1: Starting bulk analysis for user ${userId}, ${videoIds.length} videos`);

    // Get video data from database
    const videoResult = await executeQuery(`
      SELECT id, share_url, video_description, view_count, like_count, comment_count, share_count
      FROM videos 
      WHERE id = ANY($1) AND user_id = $2
    `, [videoIds, userId]) as any;

    console.log(`📊 Found ${videoResult.length} videos to analyze`);

    // Queue the analysis jobs
    const analysisQueue = new BullMQ.Queue('ai-analysis', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }
    });

    for (const video of videoResult) {
      await analysisQueue.add('video-analysis', {
        videoId: video.id,
        shareUrl: video.share_url,
        userId: userId,
        type: 'video'
      });
      console.log(`✅ Queued video analysis for ${video.id}`);
    }

    console.log(`✅ Queued ${videoResult.length} video analyses`);

    res.json({ success: true, message: `Started analysis for ${videoResult.length} videos` });

  } catch (error) {
    console.error('❌ Error starting bulk analysis:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

export default router;
