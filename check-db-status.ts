import { executeQuery } from './src/backend/database/connection.ts'

async function checkDatabase() {
  try {
    const result = await executeQuery(
      'SELECT video_id, status, updated_at FROM video_ai_analysis ORDER BY updated_at DESC LIMIT 5'
    )
    
    console.log('\n📊 Recent AI analyses in database:')
    console.table(result)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkDatabase()

