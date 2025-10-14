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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

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

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

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

    // Initialize TikTok client
    const tiktokClient = new TikTokClient(accessToken, refreshToken);

    try {
      // Get all videos from TikTok
      const allVideos = await tiktokClient.getAllVideos();
      const totalVideos = allVideos.length;
      const videosAllowed = user.videos_allowed || 10;

      // Apply freemium limits
      const videosToShow = allVideos.slice(0, videosAllowed);
      const remainingVideos = Math.max(0, totalVideos - videosAllowed);

      // Create placeholder videos for remaining count
      const placeholderVideos = Array.from({ length: remainingVideos }, (_, index) => ({
        id: `placeholder_${videosAllowed + index}`,
        create_time: new Date().toISOString(),
        duration: 0,
        video_description: '',
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        cover_image_url: '',
        embed_link: '',
        share_url: '',
        username: user.tiktok_username,
        is_placeholder: true,
        placeholder_message: videosAllowed + index === videosAllowed ? 
          `Upgrade to analyze ${remainingVideos} more videos` : 
          'Upgrade to analyze this video'
      }));

      // Combine real videos with placeholders
      const allVideosWithPlaceholders = [...videosToShow, ...placeholderVideos];

        // Get existing analytics for videos that have been analyzed
        const analyzedVideoIds = videosToShow.map(v => v.id);
        let existingAnalytics: any[] = [];

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
              v.created_at,
              v.updated_at,
              ai.ai_status,
              ai.ai_updated_at,
              ai.engagement_score,
              ai.viral_potential,
              ai.content_quality,
              ai.audience_analysis,
              ai.optimization_suggestions,
              ai.fix_suggestions,
              ai.artifacts
            FROM videos v
            LEFT JOIN video_ai_analysis ai ON v.id = ai.video_id
            WHERE v.id = ANY($1) AND v.user_id = $2
            ORDER BY v.created_at DESC
          `, [analyzedVideoIds, userId]) as any;

          existingAnalytics = analyticsResult.rows;
        }

      // Merge TikTok data with existing analytics
      const mergedVideos = allVideosWithPlaceholders.map((video: any) => {
        if (video.is_placeholder) {
          return video;
        }

        const existing = existingAnalytics.find(a => a.id === video.id);
        
        if (existing) {
          // Return existing data from database (more up-to-date)
          return {
            ...existing,
            username: user.tiktok_username,
            is_placeholder: false
          };
        } else {
          // Return fresh TikTok data
          return {
            ...video,
            username: user.tiktok_username,
            ai_status: 'pending',
            ai_updated_at: null,
            is_placeholder: false
          };
        }
      });

      res.json({
        videos: mergedVideos,
        totalVideos,
        videosAllowed,
        remainingVideos,
        planType: user.plan_type,
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user's plan info
    const userResult = await executeQuery(`
      SELECT videos_allowed, plan_type
      FROM users 
      WHERE id = $1
    `, [userId]) as any;

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const videosAllowed = userResult.rows[0].videos_allowed || 10;

    // Count how many videos user has already analyzed
    const analyzedCountResult = await executeQuery(`
      SELECT COUNT(*) as count
      FROM videos 
      WHERE user_id = $1
    `, [userId]) as any;

    const analyzedCount = parseInt(analyzedCountResult.rows[0].count);

    if (analyzedCount >= videosAllowed) {
      return res.status(402).json({ 
        error: 'Video analysis limit reached',
        message: `You can analyze up to ${videosAllowed} videos with your current plan. Upgrade to analyze more videos.`,
        analyzedCount,
        videosAllowed,
        planType: userResult.rows[0].plan_type
      });
    }

    // Get user's TikTok connection
    const tiktokResult = await executeQuery(`
      SELECT tiktok_access_token, tiktok_refresh_token, tiktok_username
      FROM users 
      WHERE id = $1
    `, [userId]) as any;

    if (tiktokResult.rows.length === 0 || !tiktokResult.rows[0].tiktok_access_token) {
      return res.status(400).json({ error: 'TikTok account not connected' });
    }

    const tiktokClient = new TikTokClient(
      tiktokResult.rows[0].tiktok_access_token,
      tiktokResult.rows[0].tiktok_refresh_token
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
        video.username || tiktokResult.rows[0].tiktok_username,
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

export default router;
