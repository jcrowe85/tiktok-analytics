import { getDirectVideoUrl } from './src/backend/utils/getVideoUrl.ts'
import { processVideoForAI, cleanupTempFiles } from './src/backend/media/processor.ts'
import { transcribeAudio } from './src/backend/ai/openai.ts'
import fs from 'fs/promises'

async function testFullPipeline() {
  console.log('\n🧪 Testing Full AI Analysis Pipeline')
  console.log('=====================================\n')
  
  // Get first video from data.json
  const data = JSON.parse(await fs.readFile('./data/data.json', 'utf-8'))
  const video = data[0]
  
  console.log(`📹 Video: ${video.id}`)
  console.log(`   Caption: ${video.caption.substring(0, 60)}...`)
  console.log(`   Duration: ${video.duration}s`)
  console.log(`   Views: ${video.view_count}`)
  console.log(`   Share URL: ${video.share_url}`)
  console.log('')
  
  try {
    // Step 1: Get direct video URL
    console.log('🚩 Step 1: Getting direct video URL...')
    const videoUrl = await getDirectVideoUrl(video.share_url)
    
    if (!videoUrl) {
      throw new Error('Could not get video URL. Add RAPIDAPI_KEY to .env or wait for rate limit to reset.')
    }
    
    console.log(`✅ Got video URL: ${videoUrl.substring(0, 80)}...`)
    console.log('')
    
    // Step 2: Process video (streaming - no download!)
    console.log('🚩 Step 2: Processing video (streaming from URL)...')
    const processingResult = await processVideoForAI(videoUrl)
    
    console.log(`✅ Video processed:`)
    console.log(`   - Duration: ${processingResult.videoMetadata.duration}s`)
    console.log(`   - Resolution: ${processingResult.videoMetadata.width}x${processingResult.videoMetadata.height}`)
    console.log(`   - Audio: ${processingResult.audioBuffer.length} bytes`)
    console.log(`   - Audio file: ${processingResult.audioPath}`)
    console.log(`   - Keyframes: ${processingResult.keyframes.length}`)
    console.log('')
    
    // Step 3: Transcribe audio with Whisper
    console.log('🚩 Step 3: Transcribing audio with OpenAI Whisper...')
    const transcript = await transcribeAudio(processingResult.audioPath)
    
    console.log(`✅ Transcription complete:`)
    console.log(`   "${transcript.text.substring(0, 100)}..."`)
    console.log(`   Segments: ${transcript.segments.length}`)
    console.log('')
    
    // Cleanup temp files
    console.log('🧹 Cleaning up temp files...')
    await cleanupTempFiles(processingResult.tempFiles)
    console.log('✅ Cleanup complete')
    console.log('')
    
    console.log('🎉 SUCCESS! Full pipeline working!')
    console.log('')
    console.log('Next steps:')
    console.log('   ✓ Video URL extraction - WORKING')
    console.log('   ✓ Video streaming - WORKING')
    console.log('   ✓ Audio extraction - WORKING')
    console.log('   ✓ Speech-to-text - WORKING')
    console.log('   ⏳ OCR on keyframes - TODO')
    console.log('   ⏳ Visual analysis - TODO')
    console.log('   ⏳ GPT-4 content analysis - TODO')
    console.log('')
    
    process.exit(0)
    
  } catch (error: any) {
    console.error('\n❌ Pipeline failed:', error.message)
    console.error('')
    
    if (error.message.includes('OPENAI_API_KEY')) {
      console.log('💡 Make sure OPENAI_API_KEY is set in .env')
    } else if (error.message.includes('video URL')) {
      console.log('💡 Try again in a few seconds or add RAPIDAPI_KEY to .env')
    } else if (error.message.includes('ffmpeg')) {
      console.log('💡 Make sure FFmpeg is installed: brew install ffmpeg')
    }
    
    process.exit(1)
  }
}

testFullPipeline()

