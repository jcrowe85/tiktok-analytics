#!/usr/bin/env tsx

/**
 * Batch Re-analyze All Videos
 * 
 * Safely re-analyzes all videos with AI analysis using GPT-4o
 * with rate limiting and error handling to prevent VPS overload
 */

import { executeQuery } from './src/backend/database/connection.ts'

interface Video {
  id: string
  share_url: string | null
  username: string | null
  is_adhoc: boolean
  ai_status: string | null
}

const BATCH_SIZE = 5 // Process 5 videos at a time
const DELAY_BETWEEN_BATCHES = 60000 // 1 minute between batches
const DELAY_BETWEEN_VIDEOS = 10000 // 10 seconds between videos in a batch

async function reanalyzeVideo(videoId: string, videoUrl: string): Promise<boolean> {
  try {
    console.log(`🔄 Re-analyzing video ${videoId}...`)
    
    const response = await fetch(`http://localhost:3000/api/ai/reprocess/${videoId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log(`✅ Video ${videoId} queued for re-analysis`)
      return true
    } else {
      console.error(`❌ Failed to re-analyze ${videoId}:`, result.error)
      return false
    }
  } catch (error) {
    console.error(`❌ Error re-analyzing ${videoId}:`, error)
    return false
  }
}

async function waitForAnalysisCompletion(videoId: string, maxWaitTime: number = 120000): Promise<boolean> {
  const startTime = Date.now()
  const checkInterval = 5000 // Check every 5 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await executeQuery(
        'SELECT status FROM video_ai_analysis WHERE video_id = $1',
        [videoId]
      )
      
      if (result.length > 0) {
        const status = result[0].status
        
        if (status === 'completed') {
          return true
        } else if (status === 'failed') {
          console.error(`❌ Analysis failed for video ${videoId}`)
          return false
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    } catch (error) {
      console.error(`❌ Error checking status for ${videoId}:`, error)
      return false
    }
  }
  
  console.warn(`⏰ Timeout waiting for video ${videoId} to complete`)
  return false
}

async function getAllVideos(): Promise<Video[]> {
  try {
    // Get all videos (both regular and ad-hoc)
    const videos = await executeQuery(`
      SELECT 
        v.id,
        v.share_url,
        v.username,
        v.is_adhoc,
        vai.status as ai_status
      FROM videos v
      LEFT JOIN video_ai_analysis vai ON v.id = vai.video_id
      ORDER BY v.created_at DESC
    `)
    
    return videos as Video[]
  } catch (error) {
    console.error('❌ Failed to fetch videos:', error)
    return []
  }
}

async function batchReanalyzeAll(dryRun: boolean = false) {
  console.log('🚀 Starting batch re-analysis...')
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no actual re-analysis)' : 'LIVE'}`)
  console.log(`   Batch size: ${BATCH_SIZE}`)
  console.log(`   Delay between batches: ${DELAY_BETWEEN_BATCHES / 1000}s`)
  console.log(`   Delay between videos: ${DELAY_BETWEEN_VIDEOS / 1000}s`)
  console.log('')
  
  // Get all videos
  const videos = await getAllVideos()
  console.log(`📊 Found ${videos.length} total videos`)
  
  // Filter videos that need re-analysis (optional: only re-analyze specific statuses)
  const videosToReanalyze = videos.filter(v => {
    // Construct video URL if share_url is missing
    if (!v.share_url && !v.username) {
      console.warn(`⚠️  Skipping video ${v.id}: no share_url or username`)
      return false
    }
    return true
  })
  
  console.log(`🎯 Will re-analyze ${videosToReanalyze.length} videos`)
  console.log('')
  
  if (dryRun) {
    console.log('📋 DRY RUN - Videos that would be re-analyzed:')
    videosToReanalyze.slice(0, 10).forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.id} (${v.is_adhoc ? 'ad-hoc' : 'regular'}) - Status: ${v.ai_status || 'none'}`)
    })
    if (videosToReanalyze.length > 10) {
      console.log(`   ... and ${videosToReanalyze.length - 10} more`)
    }
    console.log('')
    console.log('✅ Dry run complete. Run with --live to actually re-analyze.')
    return
  }
  
  // Process in batches
  let successCount = 0
  let failCount = 0
  
  for (let i = 0; i < videosToReanalyze.length; i += BATCH_SIZE) {
    const batch = videosToReanalyze.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(videosToReanalyze.length / BATCH_SIZE)
    
    console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} videos)`)
    
    // Process videos in batch with delay between each
    for (const video of batch) {
      const videoUrl = video.share_url || `https://www.tiktok.com/@${video.username}/video/${video.id}`
      
      const success = await reanalyzeVideo(video.id, videoUrl)
      
      if (success) {
        // Wait for analysis to complete before moving to next video
        const completed = await waitForAnalysisCompletion(video.id)
        if (completed) {
          successCount++
        } else {
          failCount++
        }
      } else {
        failCount++
      }
      
      // Delay between videos in the same batch
      if (batch.indexOf(video) < batch.length - 1) {
        console.log(`   ⏳ Waiting ${DELAY_BETWEEN_VIDEOS / 1000}s before next video...`)
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_VIDEOS))
      }
    }
    
    // Delay between batches (except for the last batch)
    if (i + BATCH_SIZE < videosToReanalyze.length) {
      console.log(`\n⏸️  Batch complete. Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`)
      console.log(`   Progress: ${successCount} succeeded, ${failCount} failed, ${videosToReanalyze.length - successCount - failCount} remaining`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 Batch re-analysis complete!')
  console.log(`   ✅ Succeeded: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   📊 Total: ${videosToReanalyze.length}`)
  console.log('='.repeat(60))
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = !args.includes('--live')

if (dryRun) {
  console.log('⚠️  Running in DRY RUN mode. Use --live flag to actually re-analyze videos.')
  console.log('')
}

// Run the batch re-analysis
batchReanalyzeAll(dryRun).catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

