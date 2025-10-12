import express from 'express'
import { addVideoForAnalysis, getQueueStats } from '../queue/queue.ts'
import { executeQuery, executeQueryWithResult } from '../database/connection.ts'
import { getRapidApiStatus, getVideoData } from '../utils/getVideoUrl.ts'
import { analyzeVideo } from '../ai/pipeline.ts'
import crypto from 'crypto'

const router = express.Router()

// Get system status including RapidAPI circuit breaker
router.get('/status', async (_, res) => {
  try {
    const queueStats = await getQueueStats()
    const rapidApiStatus = getRapidApiStatus()
    
    res.json({
      queue: queueStats,
      rapidApi: rapidApiStatus
    })
  } catch (error) {
    console.error('❌ Error getting system status:', error)
    res.status(500).json({ error: 'Failed to get system status' })
  }
})

// Get AI analysis status for a video
router.get('/analysis/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    
    const result = await executeQuery(
      'SELECT * FROM video_ai_analysis WHERE video_id = $1',
      [videoId]
    )
    
    if (result.length === 0) {
      return res.status(404).json({ 
        error: 'No AI analysis found for this video',
        videoId 
      })
    }
    
    const analysis = result[0]
    res.json({
      videoId: analysis.video_id,
      status: analysis.status,
      scores: analysis.scores,
      visual_scores: analysis.visual_scores,
      classifiers: analysis.classifiers,
      findings: analysis.findings,
      fix_suggestions: analysis.fix_suggestions,
      processed_at: analysis.processed_at,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at
    })
  } catch (error) {
    console.error('❌ Error fetching AI analysis:', error)
    res.status(500).json({ error: 'Failed to fetch AI analysis' })
  }
})

// Trigger AI analysis for a video
router.post('/analyze/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    const { videoUrl } = req.body
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' })
    }
    
    // Check if analysis already exists
    const existing = await executeQuery(
      'SELECT status FROM video_ai_analysis WHERE video_id = $1',
      [videoId]
    )
    
    if (existing.length > 0 && existing[0].status === 'completed') {
      return res.json({ 
        message: 'AI analysis already completed for this video',
        videoId,
        status: 'completed'
      })
    }
    
    if (existing.length > 0 && existing[0].status === 'processing') {
      return res.json({ 
        message: 'AI analysis already in progress for this video',
        videoId,
        status: 'processing'
      })
    }
    
    // Add to queue for processing
    await addVideoForAnalysis(videoId, videoUrl)
    
    res.json({ 
      message: 'Video queued for AI analysis',
      videoId,
      status: 'queued'
    })
  } catch (error) {
    console.error('❌ Error queuing AI analysis:', error)
    res.status(500).json({ error: 'Failed to queue AI analysis' })
  }
})

// Get queue statistics
router.get('/queue/stats', async (_req, res) => {
  try {
    const stats = await getQueueStats()
    res.json(stats)
  } catch (error) {
    console.error('❌ Error fetching queue stats:', error)
    res.status(500).json({ error: 'Failed to fetch queue stats' })
  }
})

// Get all AI analysis results
router.get('/analysis', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query
    
    let query = `
      SELECT 
        vai.*,
        v.posted_at_iso,
        v.caption,
        v.thumbnail_url,
        v.view_count,
        v.like_count,
        v.comment_count,
        v.share_count
      FROM video_ai_analysis vai
      LEFT JOIN videos v ON vai.video_id = v.id
    `
    
    const params: any[] = []
    const conditions: string[] = []
    
    if (status) {
      conditions.push(`vai.status = $${params.length + 1}`)
      params.push(status)
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    
    query += ` ORDER BY vai.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(limit as string), parseInt(offset as string))
    
    const result = await executeQuery(query, params)
    
    res.json({
      analyses: result,
      total: result.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    })
  } catch (error) {
    console.error('❌ Error fetching AI analyses:', error)
    res.status(500).json({ error: 'Failed to fetch AI analyses' })
  }
})

// Reprocess a video (force re-analysis)
router.post('/reprocess/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    const { videoUrl } = req.body
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'videoUrl is required' })
    }
    
    // Update status to pending
    await executeQuery(
      'UPDATE video_ai_analysis SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE video_id = $2',
      ['pending', videoId]
    )
    
    // Add to queue for processing
    console.log(`🔄 Re-processing video ${videoId} with URL: ${videoUrl}`)
    await addVideoForAnalysis(videoId, videoUrl)
    console.log(`✅ Video ${videoId} queued for re-analysis`)
    
    res.json({ 
      message: 'Video queued for reprocessing',
      videoId,
      status: 'queued'
    })
  } catch (error) {
    console.error('❌ Error reprocessing video:', error)
    res.status(500).json({ error: 'Failed to reprocess video' })
  }
})

// Ad-hoc analysis - analyze any TikTok URL without saving to database
router.post('/analyze-url', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }
    
    // Validate TikTok URL format
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
      return res.status(400).json({ error: 'Please provide a valid TikTok URL' })
    }
    
    console.log(`🔍 Starting ad-hoc analysis for URL: ${url}`)
    
    // Get video data and URL from RapidAPI
    const { videoUrl, staticData } = await getVideoData(url)
    
    if (!videoUrl) {
      return res.status(400).json({ 
        error: 'Could not retrieve video URL. Video may be private or unavailable.' 
      })
    }
    
    // Generate a temporary video ID for analysis (won't be saved to database)
    const tempVideoId = `adhoc_${crypto.randomBytes(8).toString('hex')}`
    
    console.log(`   🎯 Running AI analysis for ad-hoc video: ${tempVideoId}`)
    
    // Run the AI analysis pipeline
    const analysis = await analyzeVideo(tempVideoId, videoUrl)
    
    console.log(`✅ Ad-hoc analysis completed: ${analysis.scores.overall_100}/100`)
    
    // Return the analysis results (without saving to database)
    res.json({
      success: true,
      url,
      videoId: tempVideoId,
      staticData, // Include metadata if available
      scores: analysis.scores,
      visual_scores: analysis.visual_scores,
      classifiers: analysis.classifiers,
      findings: analysis.findings,
      fix_suggestions: analysis.fix_suggestions,
      artifacts: {
        transcript: analysis.artifacts.transcript,
        ocr_text: analysis.artifacts.ocr_text,
      },
      processed_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Ad-hoc analysis failed:', error)
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Analysis failed. Please try again.' 
    })
  }
})

// Delete a video and all its analysis data
router.delete('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    
    console.log(`🗑️ Deleting video ${videoId} and all associated data`)
    
    // Delete from video_ai_analysis table first (foreign key constraint)
    await executeQuery('DELETE FROM video_ai_analysis WHERE video_id = $1', [videoId])
    console.log(`✅ Deleted AI analysis data for video ${videoId}`)
    
    // Delete from videos table
    const result = await executeQueryWithResult('DELETE FROM videos WHERE id = $1', [videoId])
    console.log(`✅ Deleted video ${videoId} from database`)
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Video not found' })
    }
    
    res.json({ 
      success: true,
      message: `Video ${videoId} and all analysis data deleted successfully`,
      deletedVideoId: videoId
    })
    
  } catch (error) {
    console.error('❌ Error deleting video:', error)
    res.status(500).json({ error: 'Failed to delete video' })
  }
})

export default router
