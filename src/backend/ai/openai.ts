import OpenAI from 'openai'
import dotenv from 'dotenv'

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
    
    // Read the audio file
    const fs = await import('fs/promises')
    const audioBuffer = await fs.readFile(audioFilePath)
    console.log(`   Audio size: ${audioBuffer.length} bytes`)
    
    // Check if audio buffer is valid
    if (audioBuffer.length < 1000) {
      console.log('⚠️  Audio file is too small, likely silent video')
      return {
        text: '',
        segments: []
      }
    }
    
    // Create a File-like object from the file
    const filename = audioFilePath.split('/').pop() || 'audio.wav'
    const audioFile = new File([audioBuffer], filename, { type: 'audio/wav' })
    
    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
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
Analyze this TikTok video content and provide structured scores and insights.

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

Please analyze and provide:
1. Scores (0-10 integers) for: hook_strength, depth, clarity, pacing, cta, brand_fit, overall_100
2. Key findings for each score
3. Actionable suggestions for improvement

Respond in this exact JSON format:
{
  "scores": {
    "hook_strength": 7,
    "depth": 6,
    "clarity": 8,
    "pacing": 7,
    "cta": 5,
    "brand_fit": 9,
    "overall_100": 78
  },
  "findings": {
    "hook_strength": "Strong opening with question format",
    "depth": "Good explanation but could use more detail",
    "clarity": "Clear message throughout",
    "pacing": "Good rhythm, slight rush at end",
    "cta": "CTA present but not prominent enough",
    "brand_fit": "Perfect alignment with brand values"
  },
  "suggestions": [
    "Add CTA in first 3 seconds",
    "Include more specific examples",
    "Slow down delivery at the end"
  ]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',  // gpt-4o-mini supports JSON mode and is faster/cheaper
      messages: [
        {
          role: 'system',
          content: 'You are an expert TikTok content analyst. You MUST respond with valid JSON only. No explanations, no prose, ONLY the JSON object.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
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
