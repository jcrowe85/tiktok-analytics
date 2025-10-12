import express from 'express'
import axios from 'axios'

const router = express.Router()

// Proxy endpoint for TikTok thumbnails to avoid CORS and 403 issues
router.get('/thumbnail/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' })
    }

    // Try multiple TikTok CDN patterns
    const possibleUrls = [
      `https://p16-sign-va.tiktokcdn-us.com/tos-useast5-p-0068-tx/cover/${videoId}~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg`,
      `https://p16-sign.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/${videoId}`,
      `https://p16-sign-va.tiktokcdn-us.com/obj/tos-useast5-p-0068-tx/${videoId}`,
      `https://p19-common-sign.tiktokcdn-us.com/tos-useast5-p-0068-tx/cover/${videoId}~tplv-tiktokx-cropcenter-q:300:400:q72.jpeg`,
    ]

    for (const url of possibleUrls) {
      try {
        console.log(`🖼️ Trying thumbnail URL: ${url}`)
        
        const response = await axios.get(url, {
          responseType: 'stream',
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.tiktok.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          }
        })

        if (response.status === 200) {
          console.log(`✅ Successfully fetched thumbnail from: ${url}`)
          
          // Set appropriate headers
          res.set({
            'Content-Type': response.headers['content-type'] || 'image/jpeg',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'Access-Control-Allow-Origin': '*',
          })
          
          // Pipe the image data to the response
          response.data.pipe(res)
          return
        }
      } catch (error) {
        console.log(`❌ Failed to fetch from ${url}:`, error.response?.status || error.message)
        continue
      }
    }

    // If all URLs failed, return a 404
    console.log(`❌ All thumbnail URLs failed for video ${videoId}`)
    res.status(404).json({ error: 'Thumbnail not found' })

  } catch (error) {
    console.error('❌ Thumbnail proxy error:', error)
    res.status(500).json({ error: 'Failed to fetch thumbnail' })
  }
})

export default router
