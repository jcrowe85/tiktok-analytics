import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import * as fsSync from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  format: string
}

export interface ProcessingResult {
  videoMetadata: VideoMetadata
  audioPath: string
  audioBuffer: Buffer
  keyframes: Array<{
    timestamp: number
    frameBuffer: Buffer
    filename: string
  }>
  tempFiles: string[]
}

// Extract video metadata
export async function getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video')
      if (!videoStream) {
        reject(new Error('No video stream found'))
        return
      }

      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps: parseFloat(videoStream.r_frame_rate || '0') || 0,
        bitrate: parseInt(metadata.format.bit_rate || '0'),
        format: metadata.format.format_name || 'unknown'
      })
    })
  })
}

// Extract audio from video
export async function extractAudio(videoPath: string, outputPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioQuality(0)
      .format('wav')
      .outputOptions([
        '-ar 16000',  // Sample rate
        '-ac 1',      // Mono
        '-sample_fmt s16'  // 16-bit PCM
      ])
      .on('start', (cmd) => {
        console.log(`   FFmpeg command: ${cmd.substring(0, 100)}...`)
      })
      .on('end', async () => {
        try {
          const audioBuffer = await fs.readFile(outputPath)
          console.log(`   Audio file size: ${audioBuffer.length} bytes`)
          
          // Verify WAV header
          const wavHeader = audioBuffer.toString('ascii', 0, 4)
          if (wavHeader !== 'RIFF') {
            reject(new Error('Invalid WAV file - missing RIFF header'))
            return
          }
          
          resolve(audioBuffer)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', (error) => {
        console.error(`   FFmpeg error: ${error.message}`)
        reject(error)
      })
      .save(outputPath)
  })
}

// Generate keyframes at specific timestamps
export async function generateKeyframes(
  videoPath: string, 
  timestamps: number[], 
  outputDir: string
): Promise<Array<{ timestamp: number; frameBuffer: Buffer; filename: string }>> {
  const keyframes: Array<{ timestamp: number; frameBuffer: Buffer; filename: string }> = []
  
  for (const timestamp of timestamps) {
    const filename = `frame_${timestamp.toFixed(1)}s.jpg`
    const outputPath = path.join(outputDir, filename)
    
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(timestamp)
          .frames(1)
          .size('640x360') // Standard thumbnail size
          .format('image2')
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath)
      })
      
      const frameBuffer = await fs.readFile(outputPath)
      keyframes.push({
        timestamp,
        frameBuffer,
        filename
      })
    } catch (error) {
      console.warn(`⚠️ Failed to extract frame at ${timestamp}s:`, error)
    }
  }
  
  return keyframes
}

// Process video file for AI analysis (supports both local files and streaming URLs)
export async function processVideoForAI(videoSource: string): Promise<ProcessingResult> {
  console.log('🎬 Starting video processing for AI analysis...')
  console.log(`   Source: ${videoSource.substring(0, 80)}...`)
  
  const tempDir = path.join(process.cwd(), 'temp', `video_${Date.now()}`)
  await fs.mkdir(tempDir, { recursive: true })
  
  const tempFiles: string[] = []
  
  try {
    // Determine if source is URL or local file
    const isUrl = videoSource.startsWith('http://') || videoSource.startsWith('https://')
    
    if (isUrl) {
      console.log('🌐 Streaming video from URL (no download required)')
    } else {
      console.log('📁 Processing local video file')
    }
    
    // Get video metadata (works with both URLs and local files!)
    console.log('📊 Extracting video metadata...')
    const videoMetadata = await getVideoMetadata(videoSource)
    console.log(`✅ Video: ${videoMetadata.width}x${videoMetadata.height}, ${videoMetadata.duration.toFixed(1)}s`)
    
    // Extract audio (FFmpeg can stream directly from URL!)
    console.log('🎵 Extracting audio...')
    const audioPath = path.join(tempDir, 'audio.wav')
    tempFiles.push(audioPath)
    const audioBuffer = await extractAudio(videoSource, audioPath)
    console.log(`✅ Audio extracted: ${audioBuffer.length} bytes`)
    
    // Generate keyframes at strategic points
    console.log('🖼️ Generating keyframes...')
    const keyframeTimestamps = [
      0, // First frame
      1, // 1 second
      2, // 2 seconds
      3, // 3 seconds
      5, // 5 seconds
      10, // 10 seconds
      videoMetadata.duration * 0.25, // 25% of video
      videoMetadata.duration * 0.50, // 50% of video
      videoMetadata.duration * 0.75, // 75% of video
      Math.max(0, videoMetadata.duration - 1) // Last second
    ].filter(ts => ts < videoMetadata.duration)
    
    const keyframes = await generateKeyframes(videoSource, keyframeTimestamps, tempDir)
    console.log(`✅ Generated ${keyframes.length} keyframes`)
    
    // Add keyframe files to temp files for cleanup
    keyframes.forEach(kf => tempFiles.push(path.join(tempDir, kf.filename)))
    
    return {
      videoMetadata,
      audioPath,
      audioBuffer,
      keyframes,
      tempFiles
    }
  } catch (error) {
    // Cleanup on error
    await cleanupTempFiles(tempFiles)
    throw error
  }
}

// Clean up temporary files
export async function cleanupTempFiles(tempFiles: string[]): Promise<void> {
  for (const file of tempFiles) {
    try {
      await fs.unlink(file)
    } catch (error) {
      console.warn(`⚠️ Failed to delete temp file ${file}:`, error)
    }
  }
  
  // Try to remove temp directory
  try {
    const tempDir = path.dirname(tempFiles[0])
    await fs.rmdir(tempDir)
  } catch (error) {
    console.warn(`⚠️ Failed to remove temp directory:`, error)
  }
}

// Download video from URL
export async function downloadVideo(videoUrl: string, outputPath: string): Promise<void> {
  console.log(`📥 Downloading video from: ${videoUrl}`)
  
  const response = await fetch(videoUrl)
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`)
  }
  
  const fileStream = fsSync.createWriteStream(outputPath)
  await pipeline(response.body as Readable, fileStream)
  
  console.log(`✅ Video downloaded to: ${outputPath}`)
}
