import OpenAI from 'openai'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Speech-to-Text using Whisper
export async function transcribeAudio(audioFilePath: string): Promise<{
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
  }>
}> {
  try {
    console.log('🎤 Starting Whisper transcription...')
    
    // Check if audio file exists and get size
    const stats = await fs.promises.stat(audioFilePath)
    console.log(`   Audio size: ${stats.size} bytes`)
    
    // Check if audio file is valid
    if (stats.size < 1000) {
      console.log('⚠️  Audio file is too small, likely silent video')
      return {
        text: '',
        segments: []
      }
    }
    
    // Transcribe with Whisper using file stream
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment']
    })
    
    console.log('✅ Whisper transcription completed')
    console.log(`   Transcript: "${transcription.text.substring(0, 100)}..."`)
    
    return {
      text: transcription.text || '',
      segments: transcription.segments || []
    }
  } catch (error: any) {
    console.error('❌ Whisper transcription failed:', error.message)
    
    // If it's an audio format error, return empty transcript instead of failing
    if (error.message?.includes('audio file could not be decoded')) {
      console.log('⚠️  Audio decode failed, assuming silent/music-only video')
      return {
        text: '',
        segments: []
      }
    }
    
    throw error
  }
}

// Content Analysis using GPT-4
export async function analyzeContent(content: {
  transcript: string
  ocrText: string[]
  videoMetadata: {
    duration: number
    viewCount: number
    likeCount: number
    commentCount: number
    shareCount: number
  }
}): Promise<{
  scores: Record<string, number>
  findings: Record<string, string>
  suggestions: string[]
}> {
  try {
    console.log('🧠 Starting GPT-4 content analysis...')
    
    const prompt = `
Analyze this TikTok video content and provide SPECIFIC, NUANCED scores. 

IMPORTANT: 
- Treat each video uniquely - no two videos should have identical scores
- Be critical and specific - don't default to "middle of the road" scores
- Use the full range (0-10) - great content gets 8-10, poor content gets 0-3
- Your scores should reflect actual content quality, not be polite or generous

VIDEO METADATA:
- Duration: ${content.videoMetadata.duration} seconds
- Views: ${content.videoMetadata.viewCount.toLocaleString()}
- Likes: ${content.videoMetadata.likeCount.toLocaleString()}
- Comments: ${content.videoMetadata.commentCount.toLocaleString()}
- Shares: ${content.videoMetadata.shareCount.toLocaleString()}

TRANSCRIPT:
${content.transcript}

ON-SCREEN TEXT:
${content.ocrText.join('\n')}

SCORING CRITERIA (be specific and critical):

**hook_strength** (0-10): How well does the first 3 seconds grab attention?
- 9-10: Shocking, curiosity gap, immediate value promise, pattern interrupt
- 7-8: Strong question, interesting visual, clear benefit  
- 5-6: Decent opening but predictable or slow
- 3-4: Weak hook, takes too long to get to point
- 0-2: No hook, boring start, instant scroll

**depth** (0-10): How much value/information is delivered?
- 9-10: Multiple insights, actionable takeaways, comprehensive coverage
- 7-8: Good information, specific examples, practical value
- 5-6: Surface level but adequate, some useful points
- 3-4: Shallow, obvious information, no depth
- 0-2: No substance, clickbait with no delivery

**clarity** (0-10): How easy is it to understand the message?
- 9-10: Crystal clear, one focused message, perfect delivery
- 7-8: Clear with minor confusion, mostly focused
- 5-6: Somewhat clear but meandering or cluttered
- 3-4: Confusing, multiple messages, hard to follow
- 0-2: Incomprehensible, no clear point

**pacing** (0-10): Is the rhythm engaging? (shot changes, speech speed)
- 9-10: Perfect rhythm, dynamic cuts, engaging throughout
- 7-8: Good flow with variety, maintains interest
- 5-6: Adequate but could use more dynamism
- 3-4: Too slow or too rushed, loses attention
- 0-2: Completely flat or chaotic pacing

**cta** (0-10): Quality and prominence of call-to-action
- 9-10: Clear, specific, compelling CTA with urgency
- 7-8: Good CTA but could be more prominent/specific
- 5-6: CTA exists but weak or buried
- 3-4: Vague or passive CTA
- 0-2: No CTA or completely ineffective

**brand_fit** (0-10): Does this align with typical successful TikTok content?
- 9-10: Perfect TikTok format, trend-aligned, native feel
- 7-8: Good fit with minor improvements needed
- 5-6: Somewhat TikTok-appropriate but feels off
- 3-4: Doesn't feel like TikTok content
- 0-2: Completely wrong for platform

**overall_100** (0-100): Comprehensive quality score
- Calculate as weighted average, then adjust based on holistic view
- Be honest and specific to THIS video's actual quality

Provide detailed findings that explain WHY you gave each score. Be specific to this video's content.

Respond in this exact JSON format:
{
  "scores": {
    "hook_strength": 7,
    "depth": 6,
    "clarity": 8,
    "pacing": 7,
    "cta": 5,
    "brand_fit": 9,
    "overall_100": 72
  },
  "findings": {
    "hook_strength": "Opens with specific question that creates curiosity gap about X topic",
    "depth": "Provides 3 actionable tips but lacks examples or proof points",
    "clarity": "Single clear message about Y, though some jargon might confuse viewers",
    "pacing": "Good rhythm with 4 shot changes, but middle section drags slightly",
    "cta": "CTA mentioned at end but not compelling - lacks urgency or clear benefit",
    "brand_fit": "Follows trending format Z, uses native TikTok language and pacing"
  },
  "suggestions": [
    "Move CTA to first 5 seconds with specific benefit",
    "Add 1-2 concrete examples to deepen value",
    "Increase shot variety in middle section (15-25s mark)"
  ]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Full GPT-4o for better, more nuanced analysis
      messages: [
        {
          role: 'system',
          content: 'You are an expert TikTok content analyst with years of experience. Provide detailed, nuanced scores that reflect the actual content quality. Be critical and specific - avoid generic scores. You MUST respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,  // Higher temperature for more varied, authentic scores
      max_tokens: 2000,  // More tokens for detailed analysis
      response_format: { type: "json_object" }
    })
    
    const analysisText = response.choices[0]?.message?.content
    if (!analysisText) {
      throw new Error('No response from GPT-4')
    }
    
    // Parse JSON response
    const analysis = JSON.parse(analysisText)
    
    console.log('✅ GPT-4 analysis completed')
    
    return analysis
  } catch (error) {
    console.error('❌ GPT-4 analysis failed:', error)
    throw error
  }
}

// Test OpenAI connection
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const models = await openai.models.list()
    console.log('✅ OpenAI connection successful')
    console.log(`Available models: ${models.data.length}`)
    return true
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error)
    return false
  }
}
