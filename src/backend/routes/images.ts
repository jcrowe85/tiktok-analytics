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

    // Final fallback: Return a more professional-looking SVG thumbnail
    const svgContent = `<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
  </linearGradient>
</defs>
<rect width="300" height="400" fill="url(#bg)"/>
<rect x="15" y="15" width="270" height="370" fill="#000000" fill-opacity="0.2" stroke="#ffffff" stroke-width="1" stroke-opacity="0.3"/>
<!-- Play button -->
<circle cx="150" cy="200" r="40" fill="#ffffff" fill-opacity="0.9"/>
<polygon points="135,185 135,215 165,200" fill="#667eea"/>
<!-- TikTok logo area -->
<rect x="20" y="320" width="260" height="50" fill="#000000" fill-opacity="0.3"/>
<text x="150" y="340" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="14" font-weight="bold">TikTok</text>
<text x="150" y="355" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="10" opacity="0.8">${videoId.slice(-8)}</text>
</svg>`
    
    console.log(`✅ Generated simple SVG thumbnail`)
    
    res.set({
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    })
    
    res.send(svgContent)

  } catch (error) {
    console.error('❌ Thumbnail generation error:', error)
    res.status(500).json({ error: 'Failed to generate thumbnail' })
  }
})

export default router
