import { downloadTikTokVideo } from './src/backend/utils/videoDownloader.ts'
import fs from 'fs/promises'

async function testVideoDownload() {
  // Get first video from data.json
  const dataPath = './data/data.json'
  const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))
  
  const video = data[0]
  
  console.log('\n🧪 Testing Video Download')
  console.log('========================')
  console.log(`Video ID: ${video.id}`)
  console.log(`Share URL: ${video.share_url}`)
  console.log(`Caption: ${video.caption.substring(0, 80)}...`)
  console.log('')
  
  const result = await downloadTikTokVideo(video.id, video.share_url)
  
  if (result.success) {
    console.log('\n✅ Download successful!')
    console.log(`   File: ${result.localPath}`)
    
    // Check file size
    const stats = await fs.stat(result.localPath)
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  } else {
    console.log('\n❌ Download failed')
    console.log(`   Error: ${result.error}`)
    console.log('')
    console.log('💡 Next Steps:')
    console.log('   1. Sign up for a TikTok downloader API (e.g., RapidAPI)')
    console.log('   2. Add API credentials to .env')
    console.log('   3. Or use a headless browser (Playwright) to extract video URLs')
  }
  
  process.exit(0)
}

testVideoDownload().catch(console.error)

