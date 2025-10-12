import axios from 'axios'

/**
 * Get direct video URL from TikTok share URL
 * This URL can be streamed directly by FFmpeg without downloading
 */
export async function getDirectVideoUrl(shareUrl: string): Promise<string | null> {
  console.log(`🔗 Getting direct video URL from: ${shareUrl}`)
  
  // Option 1: RapidAPI (reliable, paid)
  if (process.env.RAPIDAPI_KEY) {
    try {
      const response = await axios.get('https://tiktok-video-no-watermark2.p.rapidapi.com/', {
        params: { url: shareUrl, hd: '1' },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
        },
        timeout: 10000
      })
      
      const videoUrl = response.data?.data?.play || response.data?.data?.wmplay
      
      if (videoUrl) {
        console.log(`✅ Got direct video URL (can be streamed)`)
        return videoUrl
      }
    } catch (error: any) {
      console.warn(`⚠️  RapidAPI failed:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
    }
  }
  
  // Option 2: Try alternative free APIs (less reliable)
  try {
    const freeUrl = await tryFreeVideoUrl(shareUrl)
    if (freeUrl) {
      return freeUrl
    }
  } catch (error) {
    console.warn(`⚠️  Free API failed:`, error)
  }
  
  console.error(`❌ Could not get direct video URL`)
  return null
}

/**
 * Try to get video URL from free APIs
 * These are less reliable and may be rate limited
 */
async function tryFreeVideoUrl(shareUrl: string): Promise<string | null> {
  // Try TikWM.com API (sometimes works)
  try {
    const response = await axios.post('https://www.tikwm.com/api/', {
      url: shareUrl,
      hd: 1
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    if (response.data?.data?.play) {
      console.log(`✅ Got video URL from free API`)
      return response.data.data.play
    }
  } catch (error) {
    console.warn(`⚠️  TikWM.com API failed`)
  }
  
  return null
}

/**
 * Check if a video URL is accessible
 */
export async function isVideoUrlAccessible(videoUrl: string): Promise<boolean> {
  try {
    const response = await axios.head(videoUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.tiktok.com/'
      }
    })
    
    return response.status === 200
  } catch (error) {
    return false
  }
}

