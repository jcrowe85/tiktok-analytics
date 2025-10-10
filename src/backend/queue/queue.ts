import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Queue configuration
export interface JobData {
  videoId: string
  videoUrl: string
  contentHash: string
  rulesVersion: number
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

// Job processor function (placeholder for now)
async function processAIAnalysis(job: Job<JobData>) {
  const { videoId, videoUrl, contentHash, rulesVersion } = job.data
  
  console.log(`🚩 Processing AI analysis for video ${videoId}`)
  
  try {
    // Update job progress
    await job.updateProgress(10)
    
    // TODO: Implement actual AI processing pipeline
    // 1. Media preparation
    await job.updateProgress(20)
    
    // 2. ASR processing
    await job.updateProgress(40)
    
    // 3. OCR processing
    await job.updateProgress(60)
    
    // 4. Visual analysis
    await job.updateProgress(80)
    
    // 5. LLM analysis
    await job.updateProgress(90)
    
    // 6. Persist results
    await job.updateProgress(100)
    
    console.log(`✅ Completed AI analysis for video ${videoId}`)
    
    return {
      success: true,
      videoId,
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
