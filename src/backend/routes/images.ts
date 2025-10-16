import express from 'express'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

const router = express.Router()

// Video storage directory
const VIDEO_STORAGE_DIR = path.join(process.cwd(), 'temp', 'videos')

// Ensure video storage directory exists
if (!fs.existsSync(VIDEO_STORAGE_DIR)) {
  fs.mkdirSync(VIDEO_STORAGE_DIR, { recursive: true })
}

// Helper function to get video file path
const getVideoPath = (videoId: string) => path.join(VIDEO_STORAGE_DIR, `${videoId}.mp4`)

// Helper function to check if video exists in storage
const videoExists = (videoId: string) => {
  const videoPath = getVideoPath(videoId)
  return fs.existsSync(videoPath)
}

// Helper function to serve video from storage
const serveVideoFromStorage = (videoId: string, res: express.Response) => {
  const videoPath = getVideoPath(videoId)
  
  if (!fs.existsSync(videoPath)) {
    return false
  }

  const stat = fs.statSync(videoPath)
  const fileSize = stat.size
  const range = res.req.headers.range

  if (range) {
    // Handle range requests for video seeking
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
    const chunksize = (end - start) + 1
    const file = fs.createReadStream(videoPath, { start, end })
    
    res.status(206)
    res.set({
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    })
    
    file.pipe(res)
  } else {
    // Serve entire video
    res.set({
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    })
    
    fs.createReadStream(videoPath).pipe(res)
  }
  
  return true
}

// Helper function to save video to storage
const saveVideoToStorage = async (videoId: string, videoUrl: string): Promise<boolean> => {
  try {
    const videoPath = getVideoPath(videoId)
    
    console.log(`💾 Downloading video to storage: ${videoPath}`)
    
    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      timeout: 60000, // 60 seconds for download
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': 'https://www.tiktok.com/',
      }
    })

    if (response.status === 200) {
      const writer = fs.createWriteStream(videoPath)
      response.data.pipe(writer)
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Video saved to storage: ${videoId}`)
          resolve(true)
        })
        writer.on('error', (error) => {
          console.error(`❌ Error saving video: ${error}`)
          reject(error)
        })
      })
    }
    
    return false
  } catch (error) {
    console.error(`❌ Error downloading video: ${error}`)
    return false
  }
}

// Proxy TikTok thumbnails to bypass CORS and authentication issues
router.get('/thumbnail/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' })
    }

    console.log(`🖼️ Fetching actual TikTok thumbnail for video ${videoId}`)

    // First try TikTok's oEmbed API (more reliable)
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@user/video/${videoId}`
      console.log(`🔗 Trying oEmbed API: ${oembedUrl}`)
      
      const oembedResponse = await axios.get(oembedUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'application/json',
        }
      })

      if (oembedResponse.data && oembedResponse.data.thumbnail_url) {
        console.log(`✅ Got thumbnail from oEmbed API`)
        
        const thumbnailResponse = await axios.get(oembedResponse.data.thumbnail_url, {
          responseType: 'stream',
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          }
        })

        if (thumbnailResponse.status === 200) {
          res.set({
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          })
          
          thumbnailResponse.data.pipe(res)
          return
        }
      }
    } catch (oembedError) {
      console.log(`❌ oEmbed API failed: ${oembedError instanceof Error ? oembedError.message : String(oembedError)}`)
    }

    // Fallback to direct CDN URLs
    const possibleUrls = [
      `https://p16-sign-va.tiktokcdn-us.com/tos-useast5-p-0068-tx/cover/${videoId}~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg`,
      `https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/cover/${videoId}~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg`,
      `https://p16-sign.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/${videoId}`,
      `https://p16-sign-va.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/${videoId}`,
      `https://p19-common-sign.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/${videoId}`,
    ]

    for (const url of possibleUrls) {
      try {
        console.log(`🔗 Trying TikTok CDN: ${url}`)
        
        const response = await axios.get(url, {
          responseType: 'stream',
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Referer': 'https://www.tiktok.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })

        if (response.status === 200) {
          console.log(`✅ Successfully fetched actual TikTok thumbnail`)
          
          res.set({
            'Content-Type': response.headers['content-type'] || 'image/jpeg',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'Access-Control-Allow-Origin': '*',
          })
          
          response.data.pipe(res)
          return
        }
      } catch (error: any) {
        console.log(`❌ CDN failed: ${error.response?.status || (error instanceof Error ? error.message : String(error))}`)
        continue
      }
    }

    // If all CDN attempts failed, return 404 so frontend can show fallback icon
    console.log(`❌ All TikTok CDN attempts failed for video ${videoId}`)
    res.status(404).json({ error: 'Thumbnail not available' })

  } catch (error) {
    console.error('❌ Thumbnail proxy error:', error)
    res.status(500).json({ error: 'Failed to fetch thumbnail' })
  }
})

// Proxy TikTok videos with smart caching
router.get('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' })
    }

    console.log(`🎬 Fetching TikTok video for video ${videoId}`)

    // First, check if video exists in storage
    if (videoExists(videoId)) {
      console.log(`⚡ Serving video from storage: ${videoId}`)
      if (serveVideoFromStorage(videoId, res)) {
        return
      }
    }

    // Video not in storage, fetch from RapidAPI
    if (!process.env.RAPIDAPI_KEY) {
      console.log(`❌ No RAPIDAPI_KEY configured`)
      return res.status(404).json({ error: 'Video service not configured' })
    }

    // Construct TikTok URL from video ID
    const tiktokUrl = `https://www.tiktok.com/@user/video/${videoId}`
    
    try {
      console.log(`🔗 Using RapidAPI to get video URL for: ${tiktokUrl}`)
      
      const response = await axios.get('https://tiktok-video-no-watermark2.p.rapidapi.com/', {
        params: { url: tiktokUrl, hd: '1' },
        timeout: 30000, // 30 seconds timeout
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
        }
      })

      if (response.data && response.data.data && response.data.data.play) {
        const videoUrl = response.data.data.play
        console.log(`✅ Got video URL from RapidAPI: ${videoUrl}`)
        
        // Save video to storage for future use (async, don't wait)
        saveVideoToStorage(videoId, videoUrl).catch(error => {
          console.error(`❌ Failed to save video to storage: ${error}`)
        })
        
        // Stream the video directly to client
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            'Referer': 'https://www.tiktok.com/',
          }
        })

        if (videoResponse.status === 200) {
          res.set({
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Accept-Ranges': 'bytes',
          })
          
          videoResponse.data.pipe(res)
          return
        }
      }
    } catch (rapidApiError: any) {
      console.log(`❌ RapidAPI failed: ${rapidApiError.response?.status || (rapidApiError instanceof Error ? rapidApiError.message : String(rapidApiError))}`)
    }

    // If RapidAPI failed, return 404 so frontend can show fallback
    console.log(`❌ RapidAPI video fetch failed for video ${videoId}`)
    res.status(404).json({ error: 'Video not available' })

  } catch (error) {
    console.error('❌ Video proxy error:', error)
    res.status(500).json({ error: 'Failed to fetch video' })
  }
})

export default router
