import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

// Redis connection with error handling
let redis: Redis;
let redisAvailable = false;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
  
  redis.on('ready', () => {
    redisAvailable = true;
    console.log('✅ Redis connected and ready');
    
    // Initialize queues now that Redis is ready
    if (!aiAnalysisQueue) {
      initializeQueues();
    }
  });
  
  redis.on('connect', () => {
    console.log('🔄 Redis connecting...');
  });
  
  redis.on('error', (error) => {
    redisAvailable = false;
    console.log('⚠️  Redis error:', error.message);
  });

  redis.on('close', () => {
    redisAvailable = false;
    console.log('⚠️  Redis connection closed');
  });

  // Actually connect (removed lazyConnect)
  redis.connect().catch(err => {
    redisAvailable = false;
    console.log('⚠️  Redis connection failed:', err.message);
  });
} catch (error) {
  redisAvailable = false;
  console.log('⚠️  Redis connection error:', error instanceof Error ? error.message : String(error));
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

// AI Analysis Queue (created after Redis connection is ready)
export let aiAnalysisQueue: Queue<JobData> | null = null

// Initialize queues after Redis is ready
function initializeQueues() {
  try {
    console.log('🚀 Initializing BullMQ queues...');
    
    aiAnalysisQueue = new Queue<JobData>('ai-analysis', {
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
    });
    
    console.log('✅ AI analysis queue initialized');
    
    // Start worker
    startWorker();
  } catch (error) {
    console.error('❌ Failed to initialize queues:', error);
    aiAnalysisQueue = null;
    redisAvailable = false;
  }
}

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

// Worker for AI analysis queue (created after Redis connection is ready)
export let aiAnalysisWorker: Worker<JobData> | null = null

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

// Worker for static content analysis queue (created after Redis connection is ready)
export let staticAnalysisWorker: Worker<JobData> | null = null

// Start workers after Redis is ready
function startWorker() {
  try {
    aiAnalysisWorker = new Worker<JobData>(
      'ai-analysis',
      processAIAnalysis,
      {
        connection: redis,
        concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '3'),
      }
    );
    
    staticAnalysisWorker = new Worker<JobData>(
      'ai-analysis',
      processStaticAnalysis,
      {
        connection: redis,
        concurrency: parseInt(process.env.MAX_CONCURRENT_JOBS || '3'),
      }
    );
    
    // Add event handlers for workers
    if (aiAnalysisWorker) {
      aiAnalysisWorker.on('error', (error: Error) => {
        console.error('❌ AI Analysis Worker Error:', error)
      })

      aiAnalysisWorker.on('completed', (job: Job) => {
        console.log(`✅ Job ${job.id} completed successfully`)
      })

      aiAnalysisWorker.on('failed', (job: Job | undefined, error: Error) => {
        console.error(`❌ Job ${job?.id} failed:`, error)
      })
    }
    
    console.log('✅ BullMQ workers started');
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
  }
}

// Queue management functions
export async function addVideoForAnalysis(videoId: string, userId?: number, videoUrl?: string): Promise<void> {
  if (!redisAvailable || !aiAnalysisQueue) {
    console.log('⚠️  Redis unavailable, skipping queue addition for video', videoId)
    throw new Error('Redis queue unavailable')
  }
  
  const contentHash = `hash_${videoId}_${Date.now()}` // TODO: Implement proper content hashing
  const rulesVersion = 1
  
  await aiAnalysisQueue.add('analyze-video', {
    videoId,
    userId,
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
    throw new Error('Redis queue unavailable')
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

// Event handlers are now added in startWorker() function
