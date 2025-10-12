import express from 'express'
import axios from 'axios'

const router = express.Router()

// Proxy TikTok thumbnails to bypass CORS and authentication issues
router.get('/thumbnail/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' })
    }

    console.log(`🖼️ Fetching actual TikTok thumbnail for video ${videoId}`)

    // Try to get the actual TikTok thumbnail using multiple CDN patterns
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.tiktok.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
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
      } catch (error) {
        console.log(`❌ CDN failed: ${error.response?.status || error.message}`)
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

export default router
