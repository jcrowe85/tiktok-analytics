import express from 'express'
import axios from 'axios'

const router = express.Router()

// Generate a placeholder thumbnail for TikTok videos
router.get('/thumbnail/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' })
    }

    console.log(`🖼️ Generating placeholder thumbnail for video ${videoId}`)

    // Since TikTok's CDN is heavily protected, let's generate a placeholder
    // using a service like placeholder.com or create a simple SVG
    
    const placeholderUrl = `https://via.placeholder.com/300x400/1a1a2e/ffffff?text=TikTok+Video`
    
    try {
      const response = await axios.get(placeholderUrl, {
        responseType: 'stream',
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      })

      if (response.status === 200) {
        console.log(`✅ Generated placeholder thumbnail`)
        
        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
          'Access-Control-Allow-Origin': '*',
        })
        
        response.data.pipe(res)
        return
      }
    } catch (placeholderError) {
      console.log(`❌ Placeholder service failed:`, placeholderError.message)
    }

    // Final fallback: Return a simple SVG
    const svgThumbnail = `
      <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="300" height="400" fill="#1a1a2e"/>
        <rect x="20" y="20" width="260" height="360" fill="#16213e" stroke="#4a5568" stroke-width="2"/>
        <text x="150" y="200" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16">
          TikTok Video
        </text>
        <text x="150" y="230" text-anchor="middle" fill="#a0aec0" font-family="Arial, sans-serif" font-size="12">
          ID: ${videoId}
        </text>
        <polygon points="120,280 140,280 130,300" fill="#ffffff"/>
        <circle cx="130" cy="290" r="15" fill="none" stroke="#ffffff" stroke-width="2"/>
      </svg>
    `

    console.log(`✅ Generated SVG thumbnail fallback`)
    
    res.set({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    })
    
    res.send(svgThumbnail)

  } catch (error) {
    console.error('❌ Thumbnail generation error:', error)
    res.status(500).json({ error: 'Failed to generate thumbnail' })
  }
})

export default router
