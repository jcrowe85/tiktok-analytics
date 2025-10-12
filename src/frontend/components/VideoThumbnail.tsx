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
  const [currentImageUrl, setCurrentImageUrl] = useState(coverImageUrl)

  // Try alternative thumbnail generation if original fails
  useEffect(() => {
    if (imageError && shareUrl && !currentImageUrl?.includes('/api/images/')) {
      // Try our backend proxy endpoint
      const videoId = shareUrl.match(/\/video\/(\d+)/)?.[1]
      if (videoId) {
        const proxyUrl = `/api/images/thumbnail/${videoId}`
        console.log(`🔄 Trying proxy thumbnail URL: ${proxyUrl}`)
        setCurrentImageUrl(proxyUrl)
        setImageError(false)
        setImageLoaded(false)
      }
    }
  }, [imageError, shareUrl, currentImageUrl])

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
