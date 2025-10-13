#!/usr/bin/env tsx

/**
 * Selective Batch Re-analyze
 * 
 * Re-analyzes only videos that:
 * - Have failed analysis
 * - Have no analysis
 * - Have old analysis (before GPT-4o upgrade)
 * 
 * Much safer than re-analyzing everything!
 */

import { executeQuery } from './src/backend/database/connection.ts'

const BATCH_SIZE = 3 // Smaller batches for safety
const DELAY_BETWEEN_BATCHES = 90000 // 1.5 minutes between batches
const DELAY_BETWEEN_VIDEOS = 15000 // 15 seconds between videos

// Date when we upgraded to GPT-4o (adjust this to your actual upgrade date)
const GPT4O_UPGRADE_DATE = '2025-10-13T00:00:00Z'

async function getVideosNeedingReanalysis() {
  try {
    const videos = await executeQuery(`
      SELECT 
        v.id,
        v.share_url,
        v.username,
        v.is_adhoc,
        vai.status as ai_status,
        vai.processed_at,
        vai.llm_model
      FROM videos v
      LEFT JOIN video_ai_analysis vai ON v.id = vai.video_id
      WHERE 
        vai.status IS NULL  -- No analysis
        OR vai.status = 'failed'  -- Failed analysis
        OR vai.status = 'pending'  -- Stuck in pending
        OR (vai.llm_model != 'gpt-4o' AND vai.processed_at < $1)  -- Old model
      ORDER BY v.created_at DESC
    `, [GPT4O_UPGRADE_DATE])
    
    return videos
  } catch (error) {
    console.error('❌ Failed to fetch videos:', error)
    return []
  }
}

async function reanalyzeVideo(videoId: string, videoUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:3000/api/ai/reprocess/${videoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log(`   ✅ Queued: ${videoId}`)
      return true
    } else {
      console.log(`   ❌ Failed: ${videoId} - ${result.error}`)
      return false
    }
  } catch (error) {
    console.log(`   ❌ Error: ${videoId} - ${error.message}`)
    return false
  }
}

async function waitForCompletion(videoId: string, maxWait: number = 120000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < maxWait) {
    try {
      const result = await executeQuery(
        'SELECT status FROM video_ai_analysis WHERE video_id = $1',
        [videoId]
      )
      
      if (result.length > 0 && result[0].status === 'completed') {
        return true
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000))
    } catch (error) {
      return false
    }
  }
  
  return false
}

async function main(dryRun: boolean = false) {
  console.log('🔍 Selective Batch Re-analysis')
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('')
  
  const videos = await getVideosNeedingReanalysis()
  
  console.log(`📊 Analysis Summary:`)
  const noAnalysis = videos.filter(v => !v.ai_status).length
  const failed = videos.filter(v => v.ai_status === 'failed').length
  const pending = videos.filter(v => v.ai_status === 'pending').length
  const oldModel = videos.filter(v => v.llm_model && v.llm_model !== 'gpt-4o').length
  
  console.log(`   No analysis: ${noAnalysis}`)
  console.log(`   Failed: ${failed}`)
  console.log(`   Stuck pending: ${pending}`)
  console.log(`   Old model (pre-GPT-4o): ${oldModel}`)
  console.log(`   Total to re-analyze: ${videos.length}`)
  console.log('')
  
  if (videos.length === 0) {
    console.log('✅ No videos need re-analysis!')
    return
  }
  
  if (dryRun) {
    console.log('📋 Videos that would be re-analyzed:')
    videos.slice(0, 10).forEach((v, i) => {
      const reason = !v.ai_status ? 'no analysis' : 
                     v.ai_status === 'failed' ? 'failed' :
                     v.ai_status === 'pending' ? 'stuck pending' : 'old model'
      console.log(`   ${i + 1}. ${v.id} - ${reason}`)
    })
    if (videos.length > 10) {
      console.log(`   ... and ${videos.length - 10} more`)
    }
    console.log('')
    console.log('✅ Dry run complete. Run with --live to proceed.')
    return
  }
  
  // Estimate time
  const estimatedMinutes = Math.ceil(
    (videos.length * DELAY_BETWEEN_VIDEOS + 
     Math.ceil(videos.length / BATCH_SIZE) * DELAY_BETWEEN_BATCHES) / 60000
  )
  console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes`)
  console.log('')
  
  let successCount = 0
  let failCount = 0
  
  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(videos.length / BATCH_SIZE)
    
    console.log(`📦 Batch ${batchNum}/${totalBatches}`)
    
    for (const video of batch) {
      const videoUrl = video.share_url || `https://www.tiktok.com/@${video.username}/video/${video.id}`
      
      const success = await reanalyzeVideo(video.id, videoUrl)
      
      if (success) {
        const completed = await waitForCompletion(video.id)
        if (completed) {
          successCount++
        } else {
          failCount++
        }
      } else {
        failCount++
      }
      
      if (batch.indexOf(video) < batch.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_VIDEOS))
      }
    }
    
    if (i + BATCH_SIZE < videos.length) {
      console.log(`   ⏸️  Progress: ${successCount}✅ ${failCount}❌ ${videos.length - successCount - failCount}⏳`)
      console.log(`   Waiting ${DELAY_BETWEEN_BATCHES / 1000}s...`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Complete!')
  console.log(`   ✅ Succeeded: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log('='.repeat(50))
}

const dryRun = !process.argv.includes('--live')
main(dryRun).catch(console.error)

