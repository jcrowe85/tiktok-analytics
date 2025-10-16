import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRoutes from './routes/ai.ts';
import imageRoutes from './routes/images.ts';
import adhocRoutes from './routes/adhoc.ts';
import authRoutes from './routes/auth.ts';
import tiktokAuthRoutes from './routes/tiktokAuth.ts';
import myVideosRoutes from './routes/myVideos.ts';
import growthRoutes from './routes/growth.ts';
import { testDatabaseConnection, executeQuery } from './database/connection.ts';
// Start the workers manually
console.log('🔧 Starting AI analysis worker...');
import('./queue/queue.js').catch(err => {
  console.error('❌ Failed to load queue workers:', err);
});
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// DATA_PATH removed - now reading directly from database

// Helper functions for TikTok OAuth
async function exchangeCodeForTokens(code: string): Promise<any> {
  const response = await axios.post(
    'https://open.tiktokapis.com/v2/oauth/token/',
    new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (response.data.error || response.data.error_description) {
    const errorMsg = response.data.error_description || response.data.error?.message || 'Unknown error';
    throw new Error(`Token exchange failed: ${errorMsg}`);
  }

  const tokens = response.data.data || response.data;
  
  if (!tokens.access_token) {
    throw new Error('No access token in response');
  }

  return tokens;
}

async function getTikTokUserInfo(accessToken: string): Promise<any> {
  try {
    const response = await axios.get(
      'https://open.tiktokapis.com/v2/user/info/',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        params: {
          fields: 'open_id,union_id,avatar_url,display_name'
        }
      }
    );

    const user = response.data.data?.user || {};
    
    return {
      open_id: user.open_id || '',
      username: user.display_name?.toLowerCase().replace(/\s+/g, '') || '',
      display_name: user.display_name || 'TikTok User'
    };
  } catch (error) {
    console.warn('⚠️ Could not fetch TikTok user info:', error);
    return {
      open_id: '',
      username: 'tiktok_user',
      display_name: 'TikTok User'
    };
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// AI Analysis routes
app.use('/api/ai', aiRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// TikTok OAuth routes
app.use('/api/auth/tiktok', tiktokAuthRoutes);

// Thumbnail proxy endpoint to handle expired TikTok CDN URLs
app.get('/api/thumbnail/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`🖼️  Thumbnail request for video: ${videoId}`);
    
    // Get the latest cover_image_url from database
    const result = await executeQuery(
      'SELECT cover_image_url FROM videos WHERE id = $1',
      [videoId]
    ) as any;
    
    if (!result || result.length === 0 || !result[0].cover_image_url) {
      return res.status(404).send('Thumbnail not found');
    }
    
    // Fetch the image from TikTok CDN
    const imageResponse = await axios.get(result[0].cover_image_url, {
      responseType: 'arraybuffer',
      timeout: 5000, // Reduced timeout to 5 seconds
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`✅ Thumbnail loaded successfully for video: ${req.params.videoId}`);
    
    // Set appropriate headers
    res.set('Content-Type', imageResponse.headers['content-type'] || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(imageResponse.data);
  } catch (error: any) {
    console.error(`❌ Error proxying thumbnail for video ${req.params.videoId}:`, error.message);
    // Send a 404 instead of 500 so the frontend can show the fallback icon
    res.status(404).send('Failed to load thumbnail');
  }
});

// Simple callback route to match original working OAuth flow
app.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('Missing authorization code or state');
    }

    // Verify state and get user ID
    const stateResult = await executeQuery(
      'SELECT user_id FROM user_oauth_states WHERE state = $1 AND expires_at > NOW()',
      [state as string]
    ) as any;

    if (!stateResult || stateResult.length === 0) {
      return res.status(400).send('Invalid or expired state parameter');
    }

    const userId = stateResult[0].user_id;

    // Clean up state
    await executeQuery('DELETE FROM user_oauth_states WHERE state = $1', [state as string]);

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code as string);

    // Get user info from TikTok
    const userInfo = await getTikTokUserInfo(tokens.access_token);

    // Store tokens in database
    await executeQuery(`
      UPDATE users 
      SET 
        tiktok_access_token = $1,
        tiktok_refresh_token = $2,
        tiktok_open_id = $3,
        tiktok_username = $4,
        tiktok_display_name = $5,
        tiktok_connected_at = NOW(),
        tiktok_token_expires_at = $6
      WHERE id = $7
    `, [
      tokens.access_token,
      tokens.refresh_token,
      userInfo.open_id,
      userInfo.username,
      userInfo.display_name,
      new Date(Date.now() + (tokens.expires_in * 1000)),
      userId
    ]);

    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-videos?tiktok_connected=true`);

  } catch (error) {
    console.error('❌ TikTok OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-videos?tiktok_error=true`);
  }
});

// User's own videos routes
app.use('/api/my-videos', myVideosRoutes);

// Growth metrics routes
app.use('/api/growth', growthRoutes);

// Image proxy routes
app.use('/api/images', imageRoutes);

// Ad-hoc analysis routes
app.use('/api', adhocRoutes);

/**
 * Get analytics data with AI scores
 */
app.get('/api/data', async (_req, res) => {
  try {
    // Import database connection
    const { executeQuery } = await import('./database/connection.ts');
    
    // Get videos directly from database
    const videos = await executeQuery(`
      SELECT 
        id,
        user_id,
        username,
        view_count,
        like_count,
        comment_count,
        share_count,
        duration,
        video_description,
        cover_image_url,
        share_url,
        create_time,
        posted_at_iso,
        caption,
        hashtags,
        engagement_rate,
        like_rate,
        comment_rate,
        share_rate,
        views_24h,
        velocity_24h,
        created_at,
        updated_at
      FROM videos 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Loaded ${videos.length} videos from database`)
    
    // Get AI analysis for all videos (with error handling)
    let aiAnalyses = [];
    try {
      aiAnalyses = await executeQuery(`
        SELECT 
          video_id,
          status as ai_status,
          scores,
          visual_scores,
          findings,
          fix_suggestions,
          processed_at,
          updated_at
        FROM video_ai_analysis
        WHERE status IN ('completed', 'pending', 'failed')
      `);
      console.log(`📊 Loaded ${aiAnalyses.length} AI analyses from database`)
    } catch (error) {
      console.log(`⚠️  Database not available, using fallback data: ${error instanceof Error ? error.message : String(error)}`)
      // Use empty array as fallback
      aiAnalyses = [];
    }
    
    // Create a map of AI scores by video ID
    const aiScoresMap = new Map(
      aiAnalyses.map((analysis: any) => [
        analysis.video_id,
        {
          ai_status: analysis.ai_status,
          ai_scores: analysis.scores,
          ai_visual_scores: analysis.visual_scores,
          ai_findings: analysis.findings,
          ai_fix_suggestions: analysis.fix_suggestions,
          ai_processed_at: analysis.processed_at,
          ai_updated_at: analysis.updated_at
        }
      ])
    );
    
    // Merge AI scores with video data
    const videosWithAI = videos.map((video: any) => {
      const aiData = aiScoresMap.get(video.id)
      if (aiData) {
        console.log(`🔍 Video ${video.id} AI data:`, {
          hasScores: !!aiData.ai_scores,
          hasVisualScores: !!aiData.ai_visual_scores,
          hasFindings: !!aiData.ai_findings,
          processedAt: aiData.ai_processed_at
        })
      }
      return {
        ...video,
        ...(aiData || {})
      }
    });

    res.json({
      success: true,
      count: videosWithAI.length,
      data: videosWithAI,
    });
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({
      error: 'Failed to load data',
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Serve static files from dist directory with aggressive cache busting
app.use(express.static(path.join(__dirname, '../../dist'), {
  etag: false, // Disable ETags
  lastModified: false, // Disable Last-Modified
  setHeaders: (res, filePath) => {
    // Force no-cache for HTML files
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    // Force revalidation for JS/CSS but allow caching with version check
    else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
  }
}));

/**
 * Serve React SPA for all non-API routes
 * This ensures client-side routing works on refresh
 */
app.get('*', (_req, res) => {
  // Force no-cache on HTML responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Start server
app.listen(PORT, async () => {
  console.log('\n🚀 TikTok Analytics Server');
  console.log('════════════════════════════════════════');
  console.log(`   API: http://localhost:${PORT}/api/data`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   AI API: http://localhost:${PORT}/api/ai`);
  console.log('\n   Frontend: http://localhost:5173');
  console.log('════════════════════════════════════════\n');
  
  // Test database connection
  await testDatabaseConnection();
});

