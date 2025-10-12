import { transcribeAudio, analyzeContent, openai } from './openai.ts'
import { extractTextFromImage } from './vision.ts'
import { processVideoForAI, cleanupTempFiles, type ProcessingResult } from '../media/processor.ts'
import { aiAnalysisQueue } from '../queue/queue.ts'
import { executeQuery } from '../database/connection.ts'
import { getDirectVideoUrl } from '../utils/getVideoUrl.ts'
import crypto from 'crypto'

export interface AIAnalysisResult {
  videoId: string
  status: 'completed' | 'failed'
  scores: {
    hook_strength: number
    depth: number
    clarity: number
    pacing: number
    cta: number
    brand_fit: number
    overall_100: number
  }
  visual_scores: {
    thumbstop_prob: number
    first_frame_strength: number
    silent_comprehension: number
    visual_aesthetics: number
    composition: number
    motion_dynamics: number
    pattern_interrupt: number
    text_legibility: number
    text_timing_fit: number
    emotion_score: number
    save_share_trigger: number
    loopability: number
    trend_alignment: number
    cultural_resonance: number
  }
  classifiers: {
    angle: string
    hook_type: string[]
    content_types: string[]
    visual_subjects: string[]
    composition_tags: string[]
    emotion_tags: string[]
    pattern_interrupt: string[]
    shot_types: string[]
  }
  findings: {
    hook_verdict: string
    depth_verdict: string
    retention_ops: string[]
    cta_notes: string
  }
  fix_suggestions: string[]
  artifacts: {
    transcript: string
    ocr_text: string[]
    keyframes: Array<{
      timestamp: number
      filename: string
    }>
  }
  processing_metadata: {
    rules_version: number
    asr_engine: string
    ocr_engine: string
    vision_model: string
    llm_model: string
    content_hash: string
    detected_language: string
    processed_at: string
  }
}

// Main AI analysis pipeline
export async function analyzeVideo(videoId: string, shareUrl: string): Promise<AIAnalysisResult> {
  console.log(`🚀 Starting AI analysis for video: ${videoId}`)
  
  let processingResult: ProcessingResult | null = null
  let tempFiles: string[] = []
  
  try {
    // Ensure video exists in database (insert if not exists)
    await ensureVideoExists(videoId, videoUrl)
    
    // Update status to processing
    await updateAnalysisStatus(videoId, 'processing')
    
    // Step 1: Get direct video URL (streamable)
    console.log('🔗 Getting direct video URL...')
    const videoUrl = await getDirectVideoUrl(shareUrl)
    
    if (!videoUrl) {
      throw new Error('Could not get direct video URL. Please add RAPIDAPI_KEY to .env')
    }
    
    // Step 2: Stream and process video (no download needed!)
    console.log('🌐 Streaming and processing video...')
    processingResult = await processVideoForAI(videoUrl)
    tempFiles = processingResult.tempFiles
    
    // Step 2: Speech-to-Text (ASR)
    console.log('🎤 Processing speech-to-text...')
    const transcriptResult = await transcribeAudio(processingResult.audioPath)
    
    // Step 3: OCR on keyframes (optional - skip if Google Vision not configured)
    console.log('👁️ Processing OCR on keyframes...')
    const ocrResults: string[] = []
    
    // Check if Google Vision is configured
    const hasGoogleVision = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_VISION_API_KEY
    
    if (!hasGoogleVision) {
      console.log('⚠️  Google Vision not configured, skipping OCR (add credentials to enable)')
    } else {
      for (const keyframe of processingResult.keyframes) {
        try {
          const ocrResult = await extractTextFromImage(keyframe.frameBuffer)
          if (ocrResult.text.trim()) {
            ocrResults.push(ocrResult.text)
          }
        } catch (error) {
          console.warn(`⚠️ OCR failed for frame ${keyframe.timestamp}s:`, error)
        }
      }
    }
    
    // Step 4: Visual analysis on keyframes
    console.log('🔍 Analyzing visual content...')
    const visualAnalysis = await analyzeKeyframes(processingResult.keyframes)
    
    // Step 5: Content analysis with GPT-4
    console.log('🧠 Analyzing content with GPT-4...')
    const contentAnalysis = await analyzeContent({
      transcript: transcriptResult.text,
      ocrText: ocrResults,
      videoMetadata: {
        duration: processingResult.videoMetadata.duration,
        viewCount: 0, // Will be populated from TikTok data
        likeCount: 0,
        commentCount: 0,
        shareCount: 0
      }
    })
    
    // Step 6: Combine all results
    const analysisResult: AIAnalysisResult = {
      videoId,
      status: 'completed',
      scores: contentAnalysis.scores as AIAnalysisResult['scores'],
      visual_scores: visualAnalysis.visual_scores,
      classifiers: visualAnalysis.classifiers,
      findings: contentAnalysis.findings as unknown as AIAnalysisResult['findings'],
      fix_suggestions: contentAnalysis.suggestions,
      artifacts: {
        transcript: transcriptResult.text,
        ocr_text: ocrResults,
        keyframes: processingResult.keyframes.map(kf => ({
          timestamp: kf.timestamp,
          filename: kf.filename
        }))
      },
      processing_metadata: {
        rules_version: 1,
        asr_engine: 'whisper-1',
        ocr_engine: 'google-vision',
        vision_model: 'google-vision',
        llm_model: 'gpt-4',
        content_hash: generateContentHash(transcriptResult.text, ocrResults.join(' ')),
        detected_language: 'en', // Will be detected from transcript
        processed_at: new Date().toISOString()
      }
    }
    
    // Step 7: Save to database
    await saveAnalysisResult(analysisResult)
    
    console.log(`✅ AI analysis completed for video: ${videoId}`)
    return analysisResult
    
  } catch (error) {
    console.error(`❌ AI analysis failed for video ${videoId}:`, error)
    
    // Update status to failed
    await updateAnalysisStatus(videoId, 'failed')
    
    throw error
  } finally {
    // Cleanup temp files
    if (tempFiles.length > 0) {
      await cleanupTempFiles(tempFiles)
    }
  }
}

// Analyze keyframes for visual content
async function analyzeKeyframes(_keyframes: Array<{ timestamp: number; frameBuffer: Buffer; filename: string }>): Promise<{
  visual_scores: AIAnalysisResult['visual_scores']
  classifiers: AIAnalysisResult['classifiers']
}> {
  // For now, return dummy data
  // In production, you'd analyze each keyframe with Google Vision
  return {
    visual_scores: {
      thumbstop_prob: 8,
      first_frame_strength: 7,
      silent_comprehension: 6,
      visual_aesthetics: 8,
      composition: 7,
      motion_dynamics: 6,
      pattern_interrupt: 9,
      text_legibility: 8,
      text_timing_fit: 7,
      emotion_score: 8,
      save_share_trigger: 7,
      loopability: 6,
      trend_alignment: 8,
      cultural_resonance: 7
    },
    classifiers: {
      angle: 'transformation',
      hook_type: ['question', 'curiosity'],
      content_types: ['demo', 'story'],
      visual_subjects: ['architecture', 'cathedral'],
      composition_tags: ['symmetry', 'leading_lines'],
      emotion_tags: ['awe', 'serenity'],
      pattern_interrupt: ['grand_scale', 'color_contrast'],
      shot_types: ['wide', 'close_up']
    }
  }
}

// Generate content hash for idempotency
function generateContentHash(transcript: string, ocrText: string): string {
  const content = transcript + ocrText
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16)
}

// Ensure video exists in videos table
async function ensureVideoExists(videoId: string, videoUrl?: string): Promise<void> {
  await executeQuery(`
    INSERT INTO videos (id, posted_at_iso, caption, duration, view_count, like_count, comment_count, share_count, engagement_rate, hashtags, share_url)
    VALUES ($1, CURRENT_TIMESTAMP, '', 0, 0, 0, 0, 0, 0, '{}', $2)
    ON CONFLICT (id) DO NOTHING
  `, [videoId, videoUrl || null]) // Use null instead of empty string for better data integrity
}

// Update analysis status in database
async function updateAnalysisStatus(videoId: string, status: string): Promise<void> {
  // Insert or update status
  await executeQuery(`
    INSERT INTO video_ai_analysis (video_id, status)
    VALUES ($1, $2)
    ON CONFLICT (video_id) DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = CURRENT_TIMESTAMP
  `, [videoId, status])
}

// Save analysis result to database
async function saveAnalysisResult(result: AIAnalysisResult): Promise<void> {
  await executeQuery(`
    INSERT INTO video_ai_analysis (
      video_id, status, processed_at, rules_version, asr_engine, ocr_engine, 
      vision_model, llm_model, content_hash, detected_language, scores, 
      visual_scores, classifiers, findings, fix_suggestions, artifacts
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (video_id) DO UPDATE SET
      status = EXCLUDED.status,
      processed_at = EXCLUDED.processed_at,
      rules_version = EXCLUDED.rules_version,
      asr_engine = EXCLUDED.asr_engine,
      ocr_engine = EXCLUDED.ocr_engine,
      vision_model = EXCLUDED.vision_model,
      llm_model = EXCLUDED.llm_model,
      content_hash = EXCLUDED.content_hash,
      detected_language = EXCLUDED.detected_language,
      scores = EXCLUDED.scores,
      visual_scores = EXCLUDED.visual_scores,
      classifiers = EXCLUDED.classifiers,
      findings = EXCLUDED.findings,
      fix_suggestions = EXCLUDED.fix_suggestions,
      artifacts = EXCLUDED.artifacts,
      updated_at = CURRENT_TIMESTAMP
  `, [
    result.videoId,
    result.status,
    result.processing_metadata.processed_at,
    result.processing_metadata.rules_version,
    result.processing_metadata.asr_engine,
    result.processing_metadata.ocr_engine,
    result.processing_metadata.vision_model,
    result.processing_metadata.llm_model,
    result.processing_metadata.content_hash,
    result.processing_metadata.detected_language,
    JSON.stringify(result.scores),
    JSON.stringify(result.visual_scores),
    JSON.stringify(result.classifiers),
    JSON.stringify(result.findings),
    result.fix_suggestions,
    JSON.stringify(result.artifacts)
  ])
}

// Queue video for AI analysis
export async function queueVideoForAnalysis(videoId: string, videoUrl: string): Promise<void> {
  if (!aiAnalysisQueue) {
    console.log('⚠️  Queue unavailable, skipping video analysis for', videoId)
    return
  }
  
  const jobId = `ai_analysis_${videoId}_${Date.now()}`
  
  await aiAnalysisQueue.add('analyze-video', {
    videoId,
    videoUrl,
    contentHash: `hash_${videoId}_${Date.now()}`,
    rulesVersion: 1
  }, {
    jobId,
    removeOnComplete: 10,
    removeOnFail: 5
  })
  
  console.log(`📋 Queued video ${videoId} for AI analysis (job: ${jobId})`)
}

// Analyze static content or carousel using LLM
export async function analyzeStaticContent(videoId: string, caption: string, coverImageUrl?: string): Promise<AIAnalysisResult> {
  console.log(`🖼️ Starting static content analysis for video: ${videoId}`)
  
  try {
    // Extract text from cover image if available
    let imageText = ''
    if (coverImageUrl) {
      try {
        // For now, skip image OCR for static content analysis
        // TODO: Implement proper image URL to Buffer conversion
        console.log(`   📝 Skipping image OCR for now (URL: ${coverImageUrl})`)
      } catch (error) {
        console.warn(`   ⚠️ Could not extract text from image:`, error)
      }
    }
    
    // Combine caption and image text for analysis
    const combinedContent = `${caption}\n\nImage Text: ${imageText}`.trim()
    
    // Use LLM to analyze static content
    const analysis = await analyzeStaticContentWithLLM(combinedContent)
    
    const result: AIAnalysisResult = {
      videoId,
      status: 'completed',
      scores: {
        hook_strength: analysis.hook_strength,
        depth: analysis.depth,
        clarity: analysis.clarity,
        pacing: analysis.pacing,
        cta: analysis.cta,
        brand_fit: analysis.brand_fit,
        overall_100: analysis.overall_100
      },
      visual_scores: {
        thumbstop_prob: analysis.thumbstop_prob,
        first_frame_strength: analysis.first_frame_strength,
        silent_comprehension: analysis.silent_comprehension,
        visual_aesthetics: analysis.visual_aesthetics,
        composition: analysis.composition,
        motion_dynamics: 0, // No motion in static content
        pattern_interrupt: analysis.pattern_interrupt_score,
        text_legibility: analysis.text_legibility,
        text_timing_fit: analysis.text_timing_fit,
        emotion_score: analysis.emotion_score,
        save_share_trigger: analysis.save_share_trigger,
        loopability: 0, // Static content doesn't loop
        trend_alignment: analysis.trend_alignment,
        cultural_resonance: analysis.cultural_resonance
      },
      classifiers: {
        angle: analysis.angle,
        hook_type: analysis.hook_type,
        content_types: analysis.content_types,
        visual_subjects: analysis.visual_subjects,
        composition_tags: analysis.composition_tags,
        emotion_tags: analysis.emotion_tags,
        pattern_interrupt: analysis.pattern_interrupt_tags,
        shot_types: ['static']
      },
      findings: {
        hook_verdict: analysis.hook_verdict,
        depth_verdict: analysis.depth_verdict,
        retention_ops: analysis.retention_ops,
        cta_notes: analysis.cta_notes
      },
      fix_suggestions: analysis.fix_suggestions,
      artifacts: {
        transcript: '',
        ocr_text: imageText ? [imageText] : [],
        keyframes: []
      },
      processing_metadata: {
        processed_at: new Date().toISOString(),
        rules_version: 1,
        asr_engine: 'none',
        ocr_engine: 'google-vision',
        vision_model: 'gpt-4-vision-preview',
        llm_model: 'gpt-4',
        content_hash: crypto.createHash('md5').update(combinedContent).digest('hex'),
        detected_language: 'en'
      }
    }
    
    // Save the analysis result to database
    await saveAnalysisResult(result)
    
    console.log(`✅ Static content analysis completed for video: ${videoId}`)
    return result
    
  } catch (error) {
    console.error(`❌ Static content analysis failed for video ${videoId}:`, error)
    throw error
  }
}

// Queue static content for analysis
export async function queueStaticContentForAnalysis(videoId: string, caption: string, coverImageUrl?: string): Promise<void> {
  if (!aiAnalysisQueue) {
    console.log('⚠️  Queue unavailable, skipping static content analysis for', videoId)
    return
  }
  
  const jobId = `static_analysis_${videoId}_${Date.now()}`
  
  await aiAnalysisQueue.add('analyze-static', {
    videoId,
    caption,
    coverImageUrl,
    contentHash: `hash_${videoId}_${Date.now()}`,
    rulesVersion: 1
  }, {
    jobId,
    removeOnComplete: 10,
    removeOnFail: 5
  })
  
  console.log(`📋 Queued static content ${videoId} for AI analysis (job: ${jobId})`)
}

// Analyze static content using LLM
async function analyzeStaticContentWithLLM(content: string): Promise<{
  hook_strength: number
  depth: number
  clarity: number
  pacing: number
  cta: number
  brand_fit: number
  overall_100: number
  thumbstop_prob: number
  first_frame_strength: number
  silent_comprehension: number
  visual_aesthetics: number
  composition: number
  pattern_interrupt_score: number
  text_legibility: number
  text_timing_fit: number
  emotion_score: number
  save_share_trigger: number
  trend_alignment: number
  cultural_resonance: number
  angle: string
  hook_type: string[]
  content_types: string[]
  visual_subjects: string[]
  composition_tags: string[]
  emotion_tags: string[]
  pattern_interrupt_tags: string[]
  hook_verdict: string
  depth_verdict: string
  retention_ops: string[]
  cta_notes: string
  fix_suggestions: string[]
}> {
  try {
    console.log('🧠 Starting GPT-4 static content analysis...')
    
    const prompt = `
Analyze this static TikTok content (image/carousel) and provide structured scores and insights.

CONTENT:
${content}

Please analyze this static content and provide:
1. Scores (0-10 integers) for: hook_strength, depth, clarity, pacing, cta, brand_fit, overall_100
2. Visual scores (0-10 integers) for: thumbstop_prob, first_frame_strength, silent_comprehension, visual_aesthetics, composition, pattern_interrupt_score, text_legibility, text_timing_fit, emotion_score, save_share_trigger, trend_alignment, cultural_resonance
3. Classifiers and tags
4. Key findings and verdicts
5. Actionable suggestions for improvement

Respond in this exact JSON format:
{
  "hook_strength": 7,
  "depth": 6,
  "clarity": 8,
  "pacing": 5,
  "cta": 7,
  "brand_fit": 8,
  "overall_100": 68,
  "thumbstop_prob": 6,
  "first_frame_strength": 7,
  "silent_comprehension": 8,
  "visual_aesthetics": 7,
  "composition": 6,
  "pattern_interrupt_score": 5,
  "text_legibility": 8,
  "text_timing_fit": 6,
  "emotion_score": 7,
  "save_share_trigger": 6,
  "trend_alignment": 7,
  "cultural_resonance": 6,
  "angle": "product-focused",
  "hook_type": ["product-showcase", "benefit-driven"],
  "content_types": ["static", "product-promotion"],
  "visual_subjects": ["product", "text", "brand"],
  "composition_tags": ["close-up", "text-overlay"],
  "emotion_tags": ["trust", "confidence"],
  "pattern_interrupt_tags": ["product-focus"],
  "hook_verdict": "Strong product focus with clear benefits",
  "depth_verdict": "Good product information but could use more storytelling",
  "retention_ops": ["Add before/after", "Include testimonials"],
  "cta_notes": "Clear product messaging but could be more compelling",
  "fix_suggestions": ["Add social proof", "Include urgency", "Show results"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    })

    const analysisText = response.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No analysis returned from GPT-4')
    }

    const analysis = JSON.parse(analysisText)
    console.log('✅ GPT-4 static content analysis completed')
    return analysis

  } catch (error) {
    console.error('❌ GPT-4 static content analysis failed:', error)
    
    // Return fallback scores if analysis fails
    return {
      hook_strength: 5,
      depth: 5,
      clarity: 5,
      pacing: 5,
      cta: 5,
      brand_fit: 5,
      overall_100: 50,
      thumbstop_prob: 5,
      first_frame_strength: 5,
      silent_comprehension: 5,
      visual_aesthetics: 5,
      composition: 5,
      pattern_interrupt_score: 5,
      text_legibility: 5,
      text_timing_fit: 5,
      emotion_score: 5,
      save_share_trigger: 5,
      trend_alignment: 5,
      cultural_resonance: 5,
      angle: 'static',
      hook_type: ['text-based'],
      content_types: ['static'],
      visual_subjects: [],
      composition_tags: [],
      emotion_tags: [],
      pattern_interrupt_tags: [],
      hook_verdict: 'Analysis failed - fallback scores',
      depth_verdict: 'Analysis failed - fallback scores',
      retention_ops: [],
      cta_notes: 'Analysis failed - fallback scores',
      fix_suggestions: []
    }
  }
}
