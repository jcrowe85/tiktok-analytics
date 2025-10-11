import { getDirectVideoUrl, isVideoUrlAccessible } from './src/backend/utils/getVideoUrl.ts'
import fs from 'fs/promises'

async function testStreaming() {
  console.log('\n🧪 Testing Video Streaming (No Download)')
  console.log('=========================================\n')
  
  // Get first video from data.json
  const data = JSON.parse(await fs.readFile('./data/data.json', 'utf-8'))
  const video = data[0]
  
  console.log(`Video ID: ${video.id}`)
  console.log(`Share URL: ${video.share_url}`)
  console.log('')
  
  // Step 1: Get direct video URL
  console.log('Step 1: Getting direct video URL...')
  const directVideoUrl = await getDirectVideoUrl(video.share_url)
  
  if (!directVideoUrl) {
    console.log('\n❌ Could not get direct video URL')
    console.log('\n💡 Solutions:')
    console.log('   1. Add RAPIDAPI_KEY to .env (recommended)')
    console.log('      - Sign up: https://rapidapi.com/yi005/api/tiktok-download-without-watermark')
    console.log('      - Free tier: 100 requests/month')
    console.log('      - Add to .env: RAPIDAPI_KEY=your_key_here')
    console.log('')
    console.log('   2. Try free APIs (unreliable, rate limited)')
    console.log('')
    process.exit(1)
  }
  
  console.log(`✅ Got direct video URL: ${directVideoUrl.substring(0, 80)}...`)
  console.log('')
  
  // Step 2: Check if URL is accessible
  console.log('Step 2: Checking if video URL is accessible...')
  const isAccessible = await isVideoUrlAccessible(directVideoUrl)
  
  if (isAccessible) {
    console.log('✅ Video URL is accessible and ready to stream!')
    console.log('')
    console.log('🎉 SUCCESS! Video can be streamed directly to FFmpeg')
    console.log('')
    console.log('Next steps:')
    console.log('   - FFmpeg will stream this URL (no download needed)')
    console.log('   - Extract audio directly from stream')
    console.log('   - Generate keyframes from stream')
    console.log('   - Send to OpenAI Whisper & GPT-4')
    console.log('')
    console.log('Benefits of streaming:')
    console.log('   ✓ Faster (no download wait)')
    console.log('   ✓ Less storage (no temp files)')
    console.log('   ✓ More efficient (direct pipeline)')
  } else {
    console.log('⚠️  Video URL might be expired or rate limited')
    console.log('   Try again in a few seconds')
  }
  
  process.exit(0)
}

testStreaming().catch(error => {
  console.error('Error:', error.message)
  process.exit(1)
})

