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

  // Always start with the original TikTok thumbnail URL
  useEffect(() => {
    setCurrentImageUrl(coverImageUrl)
  }, [coverImageUrl])

  // Only use proxy as fallback if original URL fails
  useEffect(() => {
    if (imageError && shareUrl && !currentImageUrl?.includes('/api/images/')) {
      // Try our backend proxy endpoint as fallback
      const videoId = shareUrl.match(/\/video\/(\d+)/)?.[1]
      if (videoId) {
        const proxyUrl = `/api/images/thumbnail/${videoId}`
        setCurrentImageUrl(proxyUrl)
        setImageError(false)
        setImageLoaded(false)
      }
    }
  }, [imageError, shareUrl, currentImageUrl])

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
