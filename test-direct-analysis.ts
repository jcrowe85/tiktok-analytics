import { analyzeVideo } from './src/backend/ai/pipeline.ts'
import fs from 'fs/promises'

async function testDirectAnalysis() {
  console.log('\n🧪 Testing Direct AI Analysis (Bypass Queue)')
  console.log('============================================\n')
  
  // Get first video from data.json
  const data = JSON.parse(await fs.readFile('./data/data.json', 'utf-8'))
  const video = data[0]
  
  console.log(`📹 Video: ${video.id}`)
  console.log(`   Caption: ${video.caption.substring(0, 60)}...`)
  console.log(`   Share URL: ${video.share_url}`)
  console.log('')
  
  try {
    console.log('🚀 Running full AI analysis pipeline...')
    console.log('')
    
    const result = await analyzeVideo(video.id, video.share_url)
    
    console.log('')
    console.log('✅ ANALYSIS COMPLETE!')
    console.log('====================')
    console.log('')
    console.log('📊 Scores:')
    console.log(JSON.stringify(result.scores, null, 2))
    console.log('')
    console.log('👁️ Visual Scores:')
    console.log(JSON.stringify(result.visual_scores, null, 2))
    console.log('')
    console.log('🏷️ Classifiers:')
    console.log(JSON.stringify(result.classifiers, null, 2))
    console.log('')
    console.log('💡 Findings:')
    console.log(JSON.stringify(result.findings, null, 2))
    console.log('')
    console.log('🔧 Suggestions:')
    result.fix_suggestions.forEach((suggestion, i) => {
      console.log(`   ${i + 1}. ${suggestion}`)
    })
    console.log('')
    
    process.exit(0)
    
  } catch (error: any) {
    console.error('')
    console.error('❌ Analysis failed:', error.message)
    console.error('')
    console.error('Stack trace:')
    console.error(error.stack)
    process.exit(1)
  }
}

testDirectAnalysis()

