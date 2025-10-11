import { addVideoForAnalysis, getQueueStats } from './src/backend/queue/queue.ts'
import fs from 'fs/promises'

async function batchAnalyzeAll() {
  console.log('\n🚀 Batch AI Analysis for All Videos')
  console.log('====================================\n')
  
  // Load all videos
  const data = JSON.parse(await fs.readFile('./data/data.json', 'utf-8'))
  console.log(`📹 Found ${data.length} videos\n`)
  
  // Filter out videos that need analysis
  const { executeQuery } = await import('./src/backend/database/connection.ts')
  
  const analyzed = await executeQuery(`
    SELECT video_id FROM video_ai_analysis WHERE status = 'completed'
  `)
  
  const analyzedIds = new Set(analyzed.map((a: any) => a.video_id))
  const needsAnalysis = data.filter((v: any) => !analyzedIds.has(v.id))
  
  console.log(`✅ Already analyzed: ${analyzedIds.size}`)
  console.log(`⏳ Needs analysis: ${needsAnalysis.length}\n`)
  
  if (needsAnalysis.length === 0) {
    console.log('🎉 All videos already analyzed!')
    process.exit(0)
  }
  
  // Ask for confirmation
  console.log(`This will analyze ${needsAnalysis.length} videos`)
  console.log(`Estimated time: ${Math.ceil(needsAnalysis.length * 40 / 60)} minutes`)
  console.log(`Estimated cost: $${(needsAnalysis.length * 0.02).toFixed(2)}`)
  console.log('\nStarting in 3 seconds... (Ctrl+C to cancel)\n')
  
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Queue all videos
  console.log('📝 Queuing videos for analysis...\n')
  let queued = 0
  
  for (const video of needsAnalysis) {
    try {
      if (video.share_url) {
        await addVideoForAnalysis(video.id, video.share_url)
        queued++
        
        if (queued % 10 === 0) {
          console.log(`   Queued: ${queued}/${needsAnalysis.length}`)
        }
      } else {
        console.log(`⚠️  Skipping ${video.id}: No share_url`)
      }
    } catch (error) {
      console.error(`❌ Failed to queue ${video.id}:`, error)
    }
  }
  
  console.log(`\n✅ Queued ${queued} videos for analysis\n`)
  
  // Monitor progress
  console.log('📊 Monitoring progress (Ctrl+C to stop monitoring, jobs will continue)\n')
  
  let lastCompleted = 0
  let checksWithoutProgress = 0
  
  while (true) {
    const stats = await getQueueStats()
    
    const progress = ((stats.completed / queued) * 100).toFixed(1)
    const remaining = queued - stats.completed
    const eta = Math.ceil(remaining * 40 / 60) // 40 sec per video
    
    console.log(`   Progress: ${stats.completed}/${queued} (${progress}%) | Active: ${stats.active} | Failed: ${stats.failed} | ETA: ${eta}min`)
    
    // Check if we're done
    if (stats.completed === queued) {
      console.log('\n🎉 All videos analyzed successfully!')
      break
    }
    
    // Check if stuck
    if (stats.completed === lastCompleted) {
      checksWithoutProgress++
      if (checksWithoutProgress > 10 && stats.active === 0) {
        console.log('\n⚠️  Processing seems stuck. Check for errors.')
        break
      }
    } else {
      checksWithoutProgress = 0
      lastCompleted = stats.completed
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  
  // Final stats
  const finalStats = await getQueueStats()
  console.log('\n📊 Final Statistics')
  console.log('===================')
  console.log(`✅ Completed: ${finalStats.completed}`)
  console.log(`❌ Failed: ${finalStats.failed}`)
  console.log(`⏳ Remaining: ${finalStats.waiting + finalStats.active}`)
  
  process.exit(0)
}

batchAnalyzeAll().catch((error) => {
  console.error('\n❌ Batch analysis failed:', error)
  process.exit(1)
})

