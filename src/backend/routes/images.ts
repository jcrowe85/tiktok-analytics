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

export default router
