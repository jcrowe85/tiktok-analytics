import express from 'express'
import { addVideoForAnalysis, getQueueStats } from '../queue/queue.ts'
import { executeQuery } from '../database/connection.ts'

const router = express.Router()

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
    await addVideoForAnalysis(videoId, videoUrl)
    
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

export default router
