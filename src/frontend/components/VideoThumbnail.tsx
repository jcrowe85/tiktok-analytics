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
    console.log(`🔍 VideoThumbnail initialized:`, { coverImageUrl, shareUrl })
    setCurrentImageUrl(coverImageUrl)
  }, [coverImageUrl])

  // Only use proxy as fallback if original URL fails
  useEffect(() => {
    if (imageError && shareUrl && !currentImageUrl?.includes('/api/images/')) {
      // Try our backend proxy endpoint as fallback
      const videoId = shareUrl.match(/\/video\/(\d+)/)?.[1]
      if (videoId) {
        const proxyUrl = `/api/images/thumbnail/${videoId}`
        console.log(`🔄 Original failed, trying proxy: ${proxyUrl}`)
        setCurrentImageUrl(proxyUrl)
        setImageError(false)
        setImageLoaded(false)
      }
    } else if (imageError && currentImageUrl?.includes('/api/images/')) {
      // Proxy also failed, show fallback icon
      console.log(`❌ Proxy also failed, showing fallback icon`)
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
        onLoad={() => {
          console.log(`✅ Image loaded successfully: ${currentImageUrl}`)
          setImageLoaded(true)
        }}
        onError={(e) => {
          console.log(`❌ Image failed to load: ${currentImageUrl}`, e)
          setImageError(true)
        }}
      />
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/2">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
        </div>
      )}
    </>
  )
}
