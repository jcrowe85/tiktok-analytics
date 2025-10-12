import axios from 'axios'

// Circuit breaker for RapidAPI failures
let rapidApiFailureCount = 0
let rapidApiLastFailure = 0
const MAX_RAPIDAPI_FAILURES = 3
const RAPIDAPI_COOLDOWN_MS = 300000 // 5 minutes

/**
 * Check if RapidAPI should be attempted based on recent failures
 */
function shouldAttemptRapidAPI(): boolean {
  const now = Date.now()
  
  // If we haven't had failures recently, allow attempts
  if (rapidApiFailureCount === 0) {
    return true
  }
  
  // If we're in cooldown period, skip RapidAPI
  if (now - rapidApiLastFailure < RAPIDAPI_COOLDOWN_MS) {
    console.log(`⏳ RapidAPI in cooldown (${Math.round((RAPIDAPI_COOLDOWN_MS - (now - rapidApiLastFailure)) / 1000)}s remaining)`)
    return false
  }
  
  // Reset failure count after cooldown
  if (rapidApiFailureCount >= MAX_RAPIDAPI_FAILURES) {
    console.log(`🔄 RapidAPI cooldown expired, resetting failure count`)
    rapidApiFailureCount = 0
    return true
  }
  
  return true
}

/**
 * Record RapidAPI failure
 */
function recordRapidApiFailure(): void {
  rapidApiFailureCount++
  rapidApiLastFailure = Date.now()
  console.log(`⚠️  RapidAPI failure #${rapidApiFailureCount}/${MAX_RAPIDAPI_FAILURES}`)
  
  if (rapidApiFailureCount >= MAX_RAPIDAPI_FAILURES) {
    console.log(`🚫 RapidAPI circuit breaker triggered - switching to free APIs for ${RAPIDAPI_COOLDOWN_MS / 1000 / 60} minutes`)
  }
}

/**
 * Get current RapidAPI circuit breaker status
 */
export function getRapidApiStatus(): {
  isActive: boolean
  failureCount: number
  maxFailures: number
  cooldownRemaining?: number
} {
  const now = Date.now()
  const cooldownRemaining = Math.max(0, RAPIDAPI_COOLDOWN_MS - (now - rapidApiLastFailure))
  
  return {
    isActive: rapidApiFailureCount >= MAX_RAPIDAPI_FAILURES && cooldownRemaining > 0,
    failureCount: rapidApiFailureCount,
    maxFailures: MAX_RAPIDAPI_FAILURES,
    cooldownRemaining: cooldownRemaining > 0 ? Math.round(cooldownRemaining / 1000) : undefined
  }
}

/**
 * Get comprehensive video data from TikTok share URL via RapidAPI
 * Returns both video URL and rich metadata
 */
export async function getVideoData(shareUrl: string): Promise<{
  videoUrl: string | null;
  staticData?: {
    videoTitle: string;
    authorUsername: string;
    authorNickname: string;
    authorAvatarUrl: string;
    musicTitle: string;
    musicArtist: string;
  };
}> {
  console.log(`🔗 Getting direct video URL from: ${shareUrl}`)
  
  // Option 1: RapidAPI (reliable, paid) - with circuit breaker
  if (process.env.RAPIDAPI_KEY && shouldAttemptRapidAPI()) {
    try {
      const response = await axios.get('https://tiktok-video-no-watermark2.p.rapidapi.com/', {
        params: { url: shareUrl, hd: '1' },
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
        },
        timeout: 10000
      })
      
      const data = response.data?.data
      const videoUrl = data?.play || data?.wmplay
      
      if (videoUrl && data) {
        console.log(`✅ Got video data from RapidAPI`)
        
        // Extract only valuable static content data (no performance metrics)
        const staticData = {
          videoTitle: data.title || '',
          authorUsername: data.author?.unique_id || '',
          authorNickname: data.author?.nickname || '',
          authorAvatarUrl: data.author?.avatar || '',
          musicTitle: data.music_info?.title || '',
          musicArtist: data.music_info?.author || ''
        }
        
        return { videoUrl, staticData }
      }
    } catch (error: any) {
      // Record RapidAPI failure for circuit breaker
      recordRapidApiFailure()
      
      console.warn(`⚠️  RapidAPI failed:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
    }
  } else if (process.env.RAPIDAPI_KEY) {
    console.log(`⏳ Skipping RapidAPI (circuit breaker active)`)
  }
  
  // Option 2: Try alternative free APIs (less reliable)
  try {
    const freeUrl = await tryFreeVideoUrl(shareUrl)
    if (freeUrl) {
      console.log(`✅ Got video URL from free API`)
      return { videoUrl: freeUrl }
    }
  } catch (error) {
    console.warn(`⚠️  Free API failed:`, error)
  }
  
  console.error(`❌ Could not get direct video URL`)
  return { videoUrl: null }
}

/**
 * Backward-compatible function for getting just the video URL
 */
export async function getDirectVideoUrl(shareUrl: string): Promise<string | null> {
  const result = await getVideoData(shareUrl)
  return result.videoUrl
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

