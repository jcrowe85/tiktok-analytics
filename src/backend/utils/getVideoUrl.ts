import axios from 'axios'

/**
 * Get comprehensive video data from TikTok share URL via RapidAPI
 * Returns both video URL and rich metadata
 */
export async function getVideoData(shareUrl: string): Promise<{
  videoUrl: string | null;
  metadata?: {
    id: string;
    title: string;
    author: {
      id: string;
      username: string;
      nickname: string;
      avatar: string;
    };
    duration: number;
    playCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    downloadCount: number;
    collectCount: number;
    createTime: number;
    cover: string;
    music: {
      id: string;
      title: string;
      author: string;
      duration: number;
    };
  };
}> {
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
      
      const data = response.data?.data
      const videoUrl = data?.play || data?.wmplay
      
      if (videoUrl && data) {
        console.log(`✅ Got video data from RapidAPI`)
        
        // Extract rich metadata
        const metadata = {
          id: data.id,
          title: data.title || '',
          author: {
            id: data.author?.id || '',
            username: data.author?.unique_id || '',
            nickname: data.author?.nickname || '',
            avatar: data.author?.avatar || ''
          },
          duration: data.duration || 0,
          playCount: data.play_count || 0,
          likeCount: data.digg_count || 0,
          commentCount: data.comment_count || 0,
          shareCount: data.share_count || 0,
          downloadCount: data.download_count || 0,
          collectCount: data.collect_count || 0,
          createTime: data.create_time || 0,
          cover: data.cover || '',
          music: {
            id: data.music_info?.id || '',
            title: data.music_info?.title || '',
            author: data.music_info?.author || '',
            duration: data.music_info?.duration || 0
          }
        }
        
        return { videoUrl, metadata }
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

