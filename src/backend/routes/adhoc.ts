import express from 'express'
import { analyzeVideo } from '../ai/pipeline.ts'
import { getVideoData } from '../utils/getVideoUrl.ts'
import { executeQuery } from '../database/connection.ts'
import axios from 'axios'

const router = express.Router()

/**
 * Get all saved ad-hoc analyses
 */
router.get('/adhoc-analyses', async (_req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        v.*,
        vai.scores,
        vai.visual_scores,
        vai.findings,
        vai.fix_suggestions,
        vai.processed_at as ai_processed_at,
        vai.status as ai_status
      FROM videos v
      LEFT JOIN video_ai_analysis vai ON v.id = vai.video_id
      WHERE v.is_adhoc = true
      ORDER BY v.created_at DESC
    `)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('❌ Error fetching ad-hoc analyses:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad-hoc analyses'
    })
  }
})

/**
 * Extract video ID from TikTok URL
 */
function extractVideoId(url: string): string | null {
  // Handle various TikTok URL formats:
  // https://www.tiktok.com/@username/video/1234567890
  // https://vm.tiktok.com/ZMhKqQqQq/
  // https://www.tiktok.com/t/ZMhKqQqQq/
  
  const patterns = [
    /\/video\/(\d+)/,           // Standard video URL
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,  // Short mobile URL
    /tiktok\.com\/t\/([A-Za-z0-9]+)/,   // Short URL
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Get video metadata from TikTok oEmbed API
 */
async function getVideoMetadata(url: string) {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    const response = await axios.get(oembedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      }
    })
    
    if (response.status === 200 && response.data) {
      return {
        videoTitle: response.data.title || 'Ad-Hoc Video',
        authorName: response.data.author_name || 'Unknown',
        thumbnailUrl: response.data.thumbnail_url || '',
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch oEmbed metadata:', error)
  }
  
  return {
    videoTitle: 'Ad-Hoc Video',
    authorName: 'Unknown',
    thumbnailUrl: '',
  }
}

/**
 * Get all ad-hoc analyses from database
 * GET /api/adhoc-analyses
 */
router.get('/adhoc-analyses', async (_req, res) => {
  try {
    // Fetch ad-hoc videos with their AI analysis
    const result = await executeQuery(`
      SELECT 
        v.id,
        v.caption,
        v.hashtags,
        v.posted_at_iso,
        v.duration,
        v.view_count,
        v.like_count,
        v.comment_count,
        v.share_count,
        v.engagement_rate,
        v.velocity_24h,
        v.share_url,
        v.cover_image_url,
        v.created_at,
        a.scores,
        a.visual_scores,
        a.findings,
        a.fix_suggestions,
        a.processed_at as ai_processed_at
      FROM videos v
      LEFT JOIN video_ai_analysis a ON v.id = a.video_id AND a.status = 'completed'
      WHERE v.is_adhoc = true
      ORDER BY v.created_at DESC
    `)
    
    res.json({
      success: true,
      count: result.length,
      data: result
    })
  } catch (error) {
    console.error('❌ Failed to fetch ad-hoc analyses:', error)
    res.status(500).json({ error: 'Failed to fetch ad-hoc analyses' })
  }
})

/**
 * Analyze any TikTok video by URL
 * POST /api/analyze-url
 * Body: { url: string }
 */
router.post('/analyze-url', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' })
    }
    
    // Validate TikTok URL
    if (!url.includes('tiktok.com')) {
      return res.status(400).json({ error: 'Invalid TikTok URL' })
    }
    
    console.log(`\n🔍 Ad-Hoc Analysis Request: ${url}`)
    
    // Extract video ID
    const videoId = extractVideoId(url)
    if (!videoId) {
      return res.status(400).json({ error: 'Could not extract video ID from URL' })
    }
    
    console.log(`📹 Video ID: ${videoId}`)
    
    // Get comprehensive video data from RapidAPI
    const videoData = await getVideoData(url)
    console.log(`📊 Video data: ${videoData.staticData?.videoTitle || 'Unknown'} by ${videoData.staticData?.authorUsername || 'Unknown'}`)
    
    // Get oEmbed metadata as fallback for thumbnail
    const oembedData = await getVideoMetadata(url)
    
    // Calculate duration and cover image URL
    const duration = videoData.staticData?.duration || 0
    const coverImageUrl = videoData.staticData?.coverImageUrl || oembedData.thumbnailUrl || ''
    
    // Save video data to database first (mark as ad-hoc)
    console.log(`🚩 Step 1: Saving video data to database...`)
    await executeQuery(`
      INSERT INTO videos (
        id, posted_at_iso, caption, duration, view_count, like_count, 
        comment_count, share_count, engagement_rate, hashtags, share_url, 
        cover_image_url, video_title, author_username, author_nickname, 
        author_avatar_url, music_title, music_artist, is_adhoc
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        posted_at_iso = EXCLUDED.posted_at_iso,
        caption = EXCLUDED.caption,
        duration = EXCLUDED.duration,
        view_count = EXCLUDED.view_count,
        like_count = EXCLUDED.like_count,
        comment_count = EXCLUDED.comment_count,
        share_count = EXCLUDED.share_count,
        engagement_rate = EXCLUDED.engagement_rate,
        hashtags = EXCLUDED.hashtags,
        share_url = EXCLUDED.share_url,
        cover_image_url = EXCLUDED.cover_image_url,
        video_title = EXCLUDED.video_title,
        author_username = EXCLUDED.author_username,
        author_nickname = EXCLUDED.author_nickname,
        author_avatar_url = EXCLUDED.author_avatar_url,
        music_title = EXCLUDED.music_title,
        music_artist = EXCLUDED.music_artist,
        is_adhoc = EXCLUDED.is_adhoc,
        updated_at = CURRENT_TIMESTAMP
    `, [
      videoId,
      new Date().toISOString(),
      videoData.staticData?.videoTitle || oembedData.videoTitle || '',
      duration,
      videoData.staticData?.viewCount || 0,
      videoData.staticData?.likeCount || 0,
      videoData.staticData?.commentCount || 0,
      videoData.staticData?.shareCount || 0,
      0, // engagement_rate (will be calculated)
      '{}',
      url,
      coverImageUrl,
      videoData.staticData?.videoTitle || oembedData.videoTitle || 'Ad-Hoc Video',
      videoData.staticData?.authorUsername || oembedData.authorName || '',
      videoData.staticData?.authorNickname || oembedData.authorName || '',
      videoData.staticData?.authorAvatarUrl || '',
      videoData.staticData?.musicTitle || '',
      videoData.staticData?.musicArtist || '',
      true // is_adhoc
    ])
    
    // Analyze the video
    console.log(`🚩 Step 2: Starting AI analysis...`)
    console.log(`   Video ID: ${videoId}`)
    console.log(`   Video URL: ${url}`)
    
    let analysis: any
    try {
      analysis = await Promise.race([
        analyzeVideo(videoId, url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout after 5 minutes')), 300000)
        )
      ])
      
      if (!analysis || analysis.status !== 'completed') {
        console.error(`❌ Analysis failed for video ${videoId}:`, analysis)
        return res.status(500).json({ 
          error: 'Analysis failed - could not complete AI analysis' 
        })
      }
    } catch (error: any) {
      console.error(`❌ Analysis error for video ${videoId}:`, error)
      return res.status(500).json({ 
        error: `Analysis failed: ${error?.message || 'Unknown error'}` 
      })
    }
    
    console.log(`✅ Analysis complete!`)
    
    // Update video with ad-hoc flag and missing metadata
    await executeQuery(`
      UPDATE videos 
      SET 
        is_adhoc = true,
        share_url = $2,
        cover_image_url = $3,
        duration = $4,
        caption = $5,
        view_count = $6,
        like_count = $7,
        comment_count = $8,
        share_count = $9,
        engagement_rate = $10
      WHERE id = $1
    `, [
      videoId,
      url,
      coverImageUrl,
      duration,
      videoData.staticData?.videoTitle || oembedData.videoTitle || '',
      videoData.staticData?.viewCount || 0,
      videoData.staticData?.likeCount || 0,
      videoData.staticData?.commentCount || 0,
      videoData.staticData?.shareCount || 0,
      (videoData.staticData?.viewCount && videoData.staticData.viewCount > 0) 
        ? ((videoData.staticData.likeCount || 0) + (videoData.staticData.commentCount || 0) + (videoData.staticData.shareCount || 0)) / videoData.staticData.viewCount
        : 0
    ])
    console.log(`✅ Updated video with ad-hoc metadata and metrics`)
    
    // Merge staticData from RapidAPI and oEmbed (RapidAPI takes priority)
    const mergedStaticData = {
      videoTitle: videoData.staticData?.videoTitle || oembedData.videoTitle || 'Ad-Hoc Video',
      authorName: videoData.staticData?.authorUsername || videoData.staticData?.authorNickname || oembedData.authorName || 'Unknown',
      authorUsername: videoData.staticData?.authorUsername || '',
      authorNickname: videoData.staticData?.authorNickname || '',
      authorAvatarUrl: videoData.staticData?.authorAvatarUrl || '',
      musicTitle: videoData.staticData?.musicTitle || '',
      musicArtist: videoData.staticData?.musicArtist || '',
      thumbnailUrl: coverImageUrl,
    }
    
    // Return analysis results with all metrics
    res.json({
      success: true,
      videoId,
      url,
      staticData: mergedStaticData,
      coverImageUrl,
      duration,
      // Performance metrics from RapidAPI
      viewCount: videoData.staticData?.viewCount || 0,
      likeCount: videoData.staticData?.likeCount || 0,
      commentCount: videoData.staticData?.commentCount || 0,
      shareCount: videoData.staticData?.shareCount || 0,
      // AI analysis results
      scores: analysis.scores,
      visual_scores: analysis.visual_scores,
      findings: analysis.findings,
      fix_suggestions: analysis.fix_suggestions,
      classifiers: analysis.classifiers,
      artifacts: analysis.artifacts,
      processed_at: analysis.processing_metadata.processed_at,
    })
    
  } catch (error) {
    console.error('❌ Ad-hoc analysis error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Analysis failed',
    })
  }
})

export default router

