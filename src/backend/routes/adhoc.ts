import express from 'express'
import { analyzeVideo } from '../ai/pipeline.ts'
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
    
    // Get video metadata
    const metadata = await getVideoMetadata(url)
    console.log(`📊 Metadata: ${metadata.videoTitle} by ${metadata.authorName}`)
    
    // Analyze the video
    console.log(`🚩 Step 1: Starting AI analysis...`)
    const analysis = await analyzeVideo(videoId, url)
    
    if (!analysis || analysis.status !== 'completed') {
      return res.status(500).json({ 
        error: 'Analysis failed - could not complete AI analysis' 
      })
    }
    
    console.log(`✅ Analysis complete!`)
    
    // Return analysis results
    res.json({
      success: true,
      videoId,
      url,
      staticData: metadata,
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

