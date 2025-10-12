import express from 'express'
import { analyzeVideo } from '../ai/pipeline.ts'
import { getVideoData } from '../utils/getVideoUrl.ts'
import { executeQuery } from '../database/connection.ts'
import axios from 'axios'

const router = express.Router()

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
    
    // Analyze the video
    console.log(`🚩 Step 1: Starting AI analysis...`)
    const analysis = await analyzeVideo(videoId, url)
    
    if (!analysis || analysis.status !== 'completed') {
      return res.status(500).json({ 
        error: 'Analysis failed - could not complete AI analysis' 
      })
    }
    
    console.log(`✅ Analysis complete!`)
    
    // Use duration from artifacts since RapidAPI doesn't provide duration
    const duration = analysis.artifacts?.keyframes?.[0]?.timestamp 
      ? Math.round(analysis.artifacts.keyframes[analysis.artifacts.keyframes.length - 1].timestamp)
      : 0
    
    // Use thumbnail from oEmbed since RapidAPI doesn't provide coverImageUrl
    const coverImageUrl = oembedData.thumbnailUrl || ''
    
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
    0, // viewCount not available from RapidAPI
    0, // likeCount not available from RapidAPI
    0, // commentCount not available from RapidAPI
    0, // shareCount not available from RapidAPI
    0  // engagementRate - set to 0 since metrics not available
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
      // Performance metrics (not available from RapidAPI)
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
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

