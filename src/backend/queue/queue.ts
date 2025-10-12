import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

// Redis connection with error handling
let redis: Redis;
let redisAvailable = false;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  
  redis.on('connect', () => {
    redisAvailable = true;
    console.log('✅ Redis connected');
  });
  
  redis.on('error', (error) => {
    redisAvailable = false;
    console.log('⚠️  Redis unavailable:', error.message);
  });
} catch (error) {
  redisAvailable = false;
  console.log('⚠️  Redis connection failed:', error instanceof Error ? error.message : String(error));
  // Create a dummy Redis instance to prevent compilation errors
  redis = new Redis({ lazyConnect: true, maxRetriesPerRequest: 0 });
}

// Queue configuration
export interface JobData {
  videoId: string
  videoUrl?: string // Optional for static content
  contentHash: string
  rulesVersion: number
  // For static content analysis
  caption?: string
  coverImageUrl?: string
}

// AI Analysis Queue (only created if Redis is available)
export const aiAnalysisQueue = redisAvailable ? new Queue<JobData>('ai-analysis', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
}) : null

// Job types
export enum JobType {
  AI_ANALYSIS = 'ai-analysis',
  ASR_PROCESSING = 'asr-processing',
  OCR_PROCESSING = 'ocr-processing',
  VISUAL_ANALYSIS = 'visual-analysis',
  LLM_ANALYSIS = 'llm-analysis',
}

// Job processor function - integrates with AI pipeline
async function processAIAnalysis(job: Job<JobData>) {
  const { videoId, videoUrl } = job.data
  
  console.log(`🚩 Processing AI analysis for video ${videoId}`)
  
  try {
    // Update job progress
    await job.updateProgress(10)
    
    // Import the AI analysis pipeline
    const { analyzeVideo } = await import('../ai/pipeline.ts')
    
    // Update job progress
    await job.updateProgress(20)
    
    // Run the full AI analysis pipeline
    const result = await analyzeVideo(videoId, videoUrl || '')
    
    // Update job progress
    await job.updateProgress(100)
    
    console.log(`✅ Completed AI analysis for video ${videoId}`)
    
    return {
      success: true,
      videoId,
      overallScore: result.scores.overall_100,
      status: result.status,
      processedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`❌ Failed AI analysis for video ${videoId}:`, error)
    throw error
  }
}

// Worker for AI analysis queue (only created if Redis is available)
export const aiAnalysisWorker = redisAvailable ? new Worker<JobData>(
  'ai-analysis',
  processAIAnalysis,
  {
    connection: redis,
    concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '3'),
  }
) : null

// Process static content analysis
async function processStaticAnalysis(job: Job<JobData>): Promise<any> {
  const { videoId, caption, coverImageUrl } = job.data
  
  if (!caption) {
    throw new Error('Caption is required for static content analysis')
  }
  
  try {
    console.log(`🚩 Processing static content analysis for video ${videoId}`)
    
    // Update job progress
    await job.updateProgress(10)
    
    // Import the static content analysis pipeline
    const { analyzeStaticContent } = await import('../ai/pipeline.ts')
    
    // Update job progress
    await job.updateProgress(20)
    
    // Run the static content analysis pipeline
    const result = await analyzeStaticContent(videoId, caption, coverImageUrl || '')
    
    // Update job progress
    await job.updateProgress(100)
    
    console.log(`✅ Completed static content analysis for video ${videoId}`)
    
    return {
      success: true,
      videoId,
      overallScore: result.scores.overall_100,
      status: result.status,
      processedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`❌ Failed static content analysis for video ${videoId}:`, error)
    throw error
  }
}

// Worker for static content analysis queue
export const staticAnalysisWorker = redisAvailable ? new Worker<JobData>(
  'ai-analysis',
  processStaticAnalysis,
  {
    connection: redis,
    concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '3'),
  }
) : null

// Queue management functions
export async function addVideoForAnalysis(videoId: string, videoUrl: string): Promise<void> {
  if (!redisAvailable || !aiAnalysisQueue) {
    console.log('⚠️  Redis unavailable, skipping queue addition for video', videoId)
    return
  }
  
  const contentHash = `hash_${videoId}_${Date.now()}` // TODO: Implement proper content hashing
  const rulesVersion = 1
  
  await aiAnalysisQueue.add('analyze-video', {
    videoId,
    videoUrl,
    contentHash,
    rulesVersion,
  }, {
    jobId: `${videoId}_${contentHash}_${rulesVersion}`, // Ensure idempotency
    priority: 1,
  })
  
  console.log(`📝 Added video ${videoId} to AI analysis queue`)
}

export async function addStaticContentForAnalysis(videoId: string, caption: string, coverImageUrl?: string): Promise<void> {
  if (!redisAvailable || !aiAnalysisQueue) {
    console.log('⚠️  Redis unavailable, skipping static content queue addition for video', videoId)
    return
  }
  
  const contentHash = `hash_${videoId}_${Date.now()}`
  const rulesVersion = 1
  
  await aiAnalysisQueue.add('analyze-static', {
    videoId,
    videoUrl: '', // Empty for static content
    caption,
    coverImageUrl,
    contentHash,
    rulesVersion,
  }, {
    jobId: `static_${videoId}_${contentHash}_${rulesVersion}`, // Ensure idempotency
    priority: 1,
  })
  
  console.log(`📝 Added static content ${videoId} to AI analysis queue`)
}

export async function getQueueStats() {
  if (!redisAvailable || !aiAnalysisQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      status: 'Redis unavailable'
    }
  }
  
  const waiting = await aiAnalysisQueue.getWaiting()
  const active = await aiAnalysisQueue.getActive()
  const completed = await aiAnalysisQueue.getCompleted()
  const failed = await aiAnalysisQueue.getFailed()
  
  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
  }
}

// Graceful shutdown
export async function closeQueues() {
  if (redisAvailable) {
    if (aiAnalysisWorker) await aiAnalysisWorker.close()
    if (aiAnalysisQueue) await aiAnalysisQueue.close()
    if (redis) await redis.quit()
  }
}

// Error handling (only if worker exists)
if (aiAnalysisWorker) {
  aiAnalysisWorker.on('error', (error) => {
    console.error('❌ AI Analysis Worker Error:', error)
  })

  aiAnalysisWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`)
  })

  aiAnalysisWorker.on('failed', (job, error) => {
    console.error(`❌ Job ${job?.id} failed:`, error)
  })
}
