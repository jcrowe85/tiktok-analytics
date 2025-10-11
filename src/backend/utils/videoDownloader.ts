import axios from 'axios'
import fs from 'fs/promises'
import * as fsSync from 'fs'
import path from 'path'

/**
 * Download TikTok video using third-party API services
 * 
 * Options:
 * 1. Use TikTok embed link (requires scraping)
 * 2. Use third-party download APIs (SnapTik, SSSTik, etc.)
 * 3. Use Playwright/Puppeteer to extract video URL
 */

interface VideoDownloadResult {
  success: boolean
  localPath?: string
  error?: string
}

/**
 * Download video from TikTok using share_url
 * 
 * Options:
 * 1. Use RapidAPI TikTok Downloader (paid, reliable)
 * 2. Use free TikTok downloader APIs (rate limited)
 * 3. Use Playwright to scrape the video URL
 */
export async function downloadTikTokVideo(
  videoId: string,
  shareUrl: string
): Promise<VideoDownloadResult> {
  console.log(`📥 Attempting to download video: ${videoId}`)
  console.log(`   Share URL: ${shareUrl}`)
  
  try {
    // Check if RapidAPI key is configured
    if (process.env.RAPIDAPI_KEY) {
      return await downloadViaRapidAPI(videoId, shareUrl)
    }
    
    // Try free SnapTik-style API
    const result = await downloadViaFreeAPI(videoId, shareUrl)
    if (result.success) {
      return result
    }
    
    // Fallback: provide instructions
    console.log('⚠️  No download method available')
    return {
      success: false,
      error: 'No API key configured. Add RAPIDAPI_KEY to .env or use a free service.'
    }
    
  } catch (error) {
    console.error(`❌ Failed to download video ${videoId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Extract video URL from TikTok embed link
 * This requires making a request to the embed page and parsing the HTML
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function extractVideoUrlFromEmbed(embedLink: string): Promise<string | null> {
  try {
    // The embed link loads a player page that contains the actual video URL
    // We need to fetch the page and extract the video URL from the HTML/JS
    const response = await axios.get(embedLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    const html = response.data
    
    // Look for video URL patterns in the HTML
    // TikTok typically embeds the video URL in a data attribute or script tag
    const videoUrlMatch = html.match(/"playAddr":"([^"]+)"/i) || 
                         html.match(/"download_addr":"([^"]+)"/i) ||
                         html.match(/src="([^"]+\.mp4[^"]*)"/i)
    
    if (videoUrlMatch && videoUrlMatch[1]) {
      // Decode escaped slashes
      const videoUrl = videoUrlMatch[1].replace(/\\\//g, '/')
      console.log(`✅ Extracted video URL from embed`)
      return videoUrl
    }
    
    console.warn(`⚠️  Could not extract video URL from embed HTML`)
    return null
    
  } catch (error) {
    console.warn(`⚠️  Failed to fetch embed page:`, error)
    return null
  }
}

/**
 * Download video file from a direct URL
 */
async function downloadVideoFile(videoId: string, videoUrl: string): Promise<VideoDownloadResult> {
  try {
    console.log(`📥 Downloading video from: ${videoUrl.substring(0, 80)}...`)
    
    // Create downloads directory
    const downloadsDir = path.join(process.cwd(), 'temp', 'videos')
    await fs.mkdir(downloadsDir, { recursive: true })
    
    const localPath = path.join(downloadsDir, `${videoId}.mp4`)
    
    // Download video
    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.tiktok.com/'
      }
    })
    
    // Save to file
    const writer = fsSync.createWriteStream(localPath)
    response.data.pipe(writer)
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
    
    console.log(`✅ Video downloaded to: ${localPath}`)
    
    return {
      success: true,
      localPath
    }
    
  } catch (error) {
    console.error(`❌ Failed to download video file:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    }
  }
}

/**
 * Download video using RapidAPI TikTok Downloader
 * https://rapidapi.com/yi005/api/tiktok-download-without-watermark
 */
async function downloadViaRapidAPI(
  videoId: string,
  shareUrl: string
): Promise<VideoDownloadResult> {
  console.log(`📡 Using RapidAPI to download video...`)
  
  try {
    const response = await axios.get('https://tiktok-download-without-watermark.p.rapidapi.com/analysis', {
      params: { url: shareUrl, hd: '1' },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'tiktok-download-without-watermark.p.rapidapi.com'
      }
    })
    
    const videoUrl = response.data?.data?.play || response.data?.data?.wmplay
    
    if (!videoUrl) {
      throw new Error('No video URL in API response')
    }
    
    console.log(`✅ Got video URL from RapidAPI`)
    return await downloadVideoFile(videoId, videoUrl)
    
  } catch (error) {
    console.error(`❌ RapidAPI download failed:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'RapidAPI failed'
    }
  }
}

/**
 * Download video using free TikTok downloader APIs
 * These are less reliable but free
 */
async function downloadViaFreeAPI(
  videoId: string,
  shareUrl: string
): Promise<VideoDownloadResult> {
  console.log(`🆓 Trying free TikTok downloader API...`)
  
  try {
    // Try SnapSave.app API (free, but rate limited)
    const response = await axios.get('https://snapsave.app/action.php', {
      params: {
        url: shareUrl,
        lang: 'en'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    // Parse the response to extract video URL
    const html = response.data
    const videoUrlMatch = html.match(/"download_url":"([^"]+)"/i)
    
    if (videoUrlMatch && videoUrlMatch[1]) {
      const videoUrl = videoUrlMatch[1].replace(/\\\//g, '/')
      console.log(`✅ Got video URL from free API`)
      return await downloadVideoFile(videoId, videoUrl)
    }
    
    console.warn(`⚠️  Could not extract video URL from free API`)
    return {
      success: false,
      error: 'Free API did not return video URL'
    }
    
  } catch (error) {
    console.warn(`⚠️  Free API failed:`, error)
    return {
      success: false,
      error: 'Free API unavailable'
    }
  }
}

/**
 * Clean up downloaded video files
 */
export async function cleanupVideoFile(localPath: string): Promise<void> {
  try {
    await fs.unlink(localPath)
    console.log(`🗑️  Cleaned up video file: ${localPath}`)
  } catch (error) {
    console.warn(`⚠️  Failed to clean up video file: ${localPath}`)
  }
}

