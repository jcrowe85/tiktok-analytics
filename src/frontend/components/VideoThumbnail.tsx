import { useState, useEffect } from 'react'
import { FiVideo, FiImage } from 'react-icons/fi'

interface VideoThumbnailProps {
  coverImageUrl?: string
  alt?: string
  className?: string
  fallbackIcon?: React.ReactNode
  shareUrl?: string // For generating alternative thumbnails
}

export function VideoThumbnail({ 
  coverImageUrl, 
  alt = "Video thumbnail",
  className = "w-full h-full object-cover transition-opacity duration-300",
  fallbackIcon,
  shareUrl
}: VideoThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(undefined)

  // Initialize with proxy URL for videos, original URL for static content
  useEffect(() => {
    if (shareUrl) {
      // For videos, use our reliable proxy endpoint
      const videoId = shareUrl.match(/\/video\/(\d+)/)?.[1]
      if (videoId) {
        const proxyUrl = `/api/images/thumbnail/${videoId}`
        console.log(`🖼️ Using proxy thumbnail for video: ${videoId}`)
        setCurrentImageUrl(proxyUrl)
      } else {
        setCurrentImageUrl(coverImageUrl)
      }
    } else {
      setCurrentImageUrl(coverImageUrl)
    }
  }, [coverImageUrl, shareUrl])

  // Fallback to original URL if proxy fails
  useEffect(() => {
    if (imageError && currentImageUrl?.includes('/api/images/') && coverImageUrl) {
      console.log(`🔄 Proxy failed, trying original URL: ${coverImageUrl}`)
      setCurrentImageUrl(coverImageUrl)
      setImageError(false)
      setImageLoaded(false)
    }
  }, [imageError, currentImageUrl, coverImageUrl])

  // If no URL provided or image failed to load, show fallback
  if (!currentImageUrl || imageError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
        {fallbackIcon || <FiVideo className="w-12 h-12 text-white/40" />}
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
