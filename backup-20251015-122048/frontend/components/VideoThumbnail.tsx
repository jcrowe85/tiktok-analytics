import { useState, useEffect } from 'react'
import { FiVideo } from 'react-icons/fi'

interface VideoThumbnailProps {
  coverImageUrl?: string
  alt?: string
  className?: string
  fallbackIcon?: React.ReactNode
  shareUrl?: string // For generating alternative thumbnails
  videoId?: string // Direct video ID for proxy endpoint
}

export function VideoThumbnail({ 
  coverImageUrl, 
  alt = "Video thumbnail",
  className = "w-full h-full object-cover transition-opacity duration-300",
  // fallbackIcon, // Currently unused
  shareUrl,
  videoId
}: VideoThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined)

  // Always use backend proxy to avoid TikTok CDN blocking
  useEffect(() => {
    let extractedVideoId = videoId // Use direct videoId if provided
    
    // If no direct videoId, try to extract from shareUrl
    if (!extractedVideoId && shareUrl) {
      extractedVideoId = shareUrl.match(/\/video\/(\d+)/)?.[1]
    }
    
    if (extractedVideoId) {
      // Use backend proxy endpoint
      const proxyUrl = `/api/images/thumbnail/${extractedVideoId}`
      // Only reset state if URL actually changed
      if (proxyUrl !== currentImageUrl) {
        setCurrentImageUrl(proxyUrl)
        setImageError(false)
        setImageLoaded(false)
      }
    } else if (coverImageUrl && coverImageUrl !== currentImageUrl) {
      // No video ID available, use original cover image URL
      setCurrentImageUrl(coverImageUrl)
      setImageError(false)
      setImageLoaded(false)
    }
  }, [coverImageUrl, shareUrl, videoId, currentImageUrl])

  // Fallback to original URL if proxy fails
  useEffect(() => {
    if (imageError && shareUrl && currentImageUrl?.includes('/api/images/')) {
      // Try original TikTok thumbnail URL as fallback
      setCurrentImageUrl(coverImageUrl)
      setImageError(false)
      setImageLoaded(false)
    }
  }, [imageError, shareUrl, currentImageUrl, coverImageUrl])

  // If no URL provided or image failed to load, show fallback
  if (!currentImageUrl || imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-purple-500/20">
        <div className="text-center">
          <FiVideo className="w-8 h-8 text-white/60 mx-auto mb-2" />
          <p className="text-xs text-white/50 font-medium">Video</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <img 
        src={currentImageUrl} 
        alt={alt}
        className={`${className} ${!imageLoaded ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/2">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        </div>
      )}
    </>
  )
}
