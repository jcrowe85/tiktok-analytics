import { Pool, PoolClient } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Execute a query with error handling
export async function executeQuery<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows
  } catch (error) {
    console.error('❌ Database query error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Execute a transaction
export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Insert or update video
export async function upsertVideo(videoData: {
  id: string
  caption: string
  hashtags: string[]
  posted_at_iso: string
  duration: number
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  engagement_rate: number
  velocity_24h?: number
}) {
  const query = `
    INSERT INTO videos (
      id, caption, hashtags, posted_at_iso, duration,
      view_count, like_count, comment_count, share_count,
      engagement_rate, velocity_24h
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) 
    DO UPDATE SET
      caption = EXCLUDED.caption,
      hashtags = EXCLUDED.hashtags,
      posted_at_iso = EXCLUDED.posted_at_iso,
      duration = EXCLUDED.duration,
      view_count = EXCLUDED.view_count,
      like_count = EXCLUDED.like_count,
      comment_count = EXCLUDED.comment_count,
      share_count = EXCLUDED.share_count,
      engagement_rate = EXCLUDED.engagement_rate,
      velocity_24h = EXCLUDED.velocity_24h,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `
  
  const values = [
    videoData.id,
    videoData.caption,
    videoData.hashtags,
    videoData.posted_at_iso,
    videoData.duration,
    videoData.view_count,
    videoData.like_count,
    videoData.comment_count,
    videoData.share_count,
    videoData.engagement_rate,
    videoData.velocity_24h || null,
  ]
  
  const result = await executeQuery(query, values)
  return result[0]
}

// Insert AI analysis result
export async function insertAIAnalysis(analysisData: {
  video_id: string
  status: string
  rules_version: number
  asr_engine?: string
  ocr_engine?: string
  vision_model?: string
  llm_model?: string
  content_hash: string
  detected_language?: string
  scores: any
  visual_scores: any
  classifiers: any
  findings?: any
  fix_suggestions?: string[]
  artifacts?: any
  quality_band?: string
  policy_flags?: string[]
  platform_blockers?: string[]
}) {
  const query = `
    INSERT INTO video_ai_analysis (
      video_id, status, rules_version, asr_engine, ocr_engine,
      vision_model, llm_model, content_hash, detected_language,
      scores, visual_scores, classifiers, findings, fix_suggestions,
      artifacts, quality_band, policy_flags, platform_blockers
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
    )
    RETURNING id
  `
  
  const values = [
    analysisData.video_id,
    analysisData.status,
    analysisData.rules_version,
    analysisData.asr_engine || null,
    analysisData.ocr_engine || null,
    analysisData.vision_model || null,
    analysisData.llm_model || null,
    analysisData.content_hash,
    analysisData.detected_language || null,
    JSON.stringify(analysisData.scores),
    JSON.stringify(analysisData.visual_scores),
    JSON.stringify(analysisData.classifiers),
    analysisData.findings ? JSON.stringify(analysisData.findings) : null,
    analysisData.fix_suggestions || null,
    analysisData.artifacts ? JSON.stringify(analysisData.artifacts) : null,
    analysisData.quality_band || null,
    analysisData.policy_flags || null,
    analysisData.platform_blockers || null,
  ]
  
  const result = await executeQuery(query, values)
  return result[0]
}

// Get videos with AI analysis status
export async function getVideosWithAIStatus() {
  const query = `
    SELECT 
      v.*,
      a.status as ai_status,
      a.processed_at,
      a.scores,
      a.visual_scores,
      a.quality_band
    FROM videos v
    LEFT JOIN video_ai_analysis a ON v.id = a.video_id
    ORDER BY v.posted_at_iso DESC
  `
  
  return await executeQuery(query)
}

// Close database connection
export async function closeDatabase() {
  await pool.end()
}
