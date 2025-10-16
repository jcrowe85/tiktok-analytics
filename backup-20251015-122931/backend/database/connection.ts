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

// Execute a query and return full result (for operations that need rowCount)
export async function executeQueryWithResult<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return { rows: result.rows, rowCount: result.rowCount || 0 }
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
  username?: string
  caption: string
  video_description?: string
  hashtags: string[]
  posted_at_iso: string
  create_time?: number
  duration: number
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  engagement_rate: number
  like_rate?: number
  comment_rate?: number
  share_rate?: number
  views_24h?: number
  velocity_24h?: number
  share_url?: string
  embed_link?: string
  cover_image_url?: string
  // Static content data from RapidAPI (optional)
  video_title?: string
  author_username?: string
  author_nickname?: string
  author_avatar_url?: string
  music_title?: string
  music_artist?: string
}) {
  const query = `
    INSERT INTO videos (
      id, username, caption, video_description, hashtags, posted_at_iso, create_time,
      duration, view_count, like_count, comment_count, share_count,
      engagement_rate, like_rate, comment_rate, share_rate,
      views_24h, velocity_24h, share_url, embed_link, cover_image_url,
      video_title, author_username, author_nickname, author_avatar_url, music_title, music_artist
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    ON CONFLICT (id) 
    DO UPDATE SET
      username = EXCLUDED.username,
      caption = EXCLUDED.caption,
      video_description = EXCLUDED.video_description,
      hashtags = EXCLUDED.hashtags,
      posted_at_iso = EXCLUDED.posted_at_iso,
      create_time = EXCLUDED.create_time,
      duration = EXCLUDED.duration,
      view_count = EXCLUDED.view_count,
      like_count = EXCLUDED.like_count,
      comment_count = EXCLUDED.comment_count,
      share_count = EXCLUDED.share_count,
      engagement_rate = EXCLUDED.engagement_rate,
      like_rate = EXCLUDED.like_rate,
      comment_rate = EXCLUDED.comment_rate,
      share_rate = EXCLUDED.share_rate,
      views_24h = EXCLUDED.views_24h,
      velocity_24h = EXCLUDED.velocity_24h,
      share_url = EXCLUDED.share_url,
      embed_link = EXCLUDED.embed_link,
      cover_image_url = EXCLUDED.cover_image_url,
      video_title = EXCLUDED.video_title,
      author_username = EXCLUDED.author_username,
      author_nickname = EXCLUDED.author_nickname,
      author_avatar_url = EXCLUDED.author_avatar_url,
      music_title = EXCLUDED.music_title,
      music_artist = EXCLUDED.music_artist,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `
  
  const values = [
    videoData.id,
    videoData.username || null,
    videoData.caption,
    videoData.video_description || videoData.caption, // Fallback to caption
    videoData.hashtags,
    videoData.posted_at_iso,
    videoData.create_time || null,
    videoData.duration,
    videoData.view_count,
    videoData.like_count,
    videoData.comment_count,
    videoData.share_count,
    videoData.engagement_rate,
    videoData.like_rate || null,
    videoData.comment_rate || null,
    videoData.share_rate || null,
    videoData.views_24h || null,
    videoData.velocity_24h || null,
    videoData.share_url || null,
    videoData.embed_link || null,
    videoData.cover_image_url || null,
    videoData.video_title || null,
    videoData.author_username || null,
    videoData.author_nickname || null,
    videoData.author_avatar_url || null,
    videoData.music_title || null,
    videoData.music_artist || null,
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
