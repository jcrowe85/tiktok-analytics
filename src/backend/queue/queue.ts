import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

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

// AI Analysis Queue
export const aiAnalysisQueue = new Queue<JobData>('ai-analysis', {
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
})

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
    const result = await analyzeVideo(videoId, videoUrl)
    
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

// Worker for AI analysis queue
export const aiAnalysisWorker = new Worker<JobData>(
  'ai-analysis',
  processAIAnalysis,
  {
    connection: redis,
    concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '3'),
  }
)

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
export const staticAnalysisWorker = new Worker<JobData>(
  'ai-analysis',
  processStaticAnalysis,
  {
    connection: redis,
    concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '3'),
  }
)

// Queue management functions
export async function addVideoForAnalysis(videoId: string, videoUrl: string): Promise<void> {
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
  await aiAnalysisWorker.close()
  await aiAnalysisQueue.close()
  await redis.quit()
}

// Error handling
aiAnalysisWorker.on('error', (error) => {
  console.error('❌ AI Analysis Worker Error:', error)
})

aiAnalysisWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`)
})

aiAnalysisWorker.on('failed', (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error)
})
