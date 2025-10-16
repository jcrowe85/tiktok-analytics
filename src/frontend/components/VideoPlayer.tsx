import { useState, useRef } from 'react'
import { FiVideo, FiPlay, FiPause, FiVolume2, FiVolumeX, FiExternalLink } from 'react-icons/fi'
import { VideoThumbnail } from './VideoThumbnail'

interface VideoPlayerProps {
  coverImageUrl?: string
  shareUrl?: string
  videoId?: string
  className?: string
  showPlayButton?: boolean
  onVideoClick?: () => void
}

export function VideoPlayer({ 
  coverImageUrl,
  shareUrl,
  videoId,
  className = "w-full h-full object-cover transition-all duration-300",
  showPlayButton = true,
  onVideoClick
}: VideoPlayerProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(true)
  const [hasClicked, setHasClicked] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Extract video ID
  const extractedVideoId = videoId || (shareUrl ? shareUrl.match(/\/video\/(\d+)/)?.[1] : null)

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation() // More aggressive event stopping
    
    console.log('🎬 Video clicked, attempting to play inline')
    setHasClicked(true)
    
    if (onVideoClick) {
      onVideoClick()
      return
    }

    if (videoLoaded && !videoError && videoRef.current) {
      // Toggle video play/pause
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(console.error)
      }
    } else if (extractedVideoId) {
      // Try to load the video if it hasn't loaded yet
      console.log('🔄 Attempting to load video...')
      if (videoRef.current) {
        videoRef.current.load()
      }
    } else if (shareUrl) {
      // Fallback: Open TikTok video in new tab
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleVideoLoad = () => {
    console.log('✅ Video loaded successfully')
    setVideoLoaded(true)
    setVideoError(false)
    setShowThumbnail(false) // Hide thumbnail when video loads
    
    // Auto-play the video when it loads
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('❌ Auto-play failed:', error)
        // Auto-play might fail due to browser policies, that's okay
      })
    }
  }

  const handleVideoError = (e: any) => {
    console.log('❌ Video failed to load:', e)
    setVideoError(true)
    setVideoLoaded(false)
    setShowThumbnail(true) // Show thumbnail again on error
  }

  const handlePlay = () => {
    console.log('▶️ Video started playing')
    setIsPlaying(true)
    setShowThumbnail(false)
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const openInTikTok = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div 
      className="relative w-full h-full group overflow-hidden rounded-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleVideoClick}
    >
      {/* Video Element */}
      {extractedVideoId && hasClicked && (
        <video
          ref={videoRef}
          src={`/api/images/video/${extractedVideoId}`}
          className={`${className} ${videoLoaded && !showThumbnail ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          controls={false}
          onLoadedData={handleVideoLoad}
          onCanPlay={handleVideoLoad}
          onError={handleVideoError}
          onPlay={handlePlay}
          onPause={handlePause}
          onLoadStart={() => console.log('🔄 Video loading started')}
        />
      )}

      {/* Thumbnail Fallback */}
      {showThumbnail && (
        <div 
          className="relative w-full h-full cursor-pointer"
        >
          <VideoThumbnail
            coverImageUrl={coverImageUrl}
            shareUrl={shareUrl}
            videoId={videoId}
            className={`${className} ${isHovered ? 'scale-105' : 'scale-100'} transition-transform duration-300`}
          />
        </div>
      )}

      {/* Loading overlay */}
      {!videoLoaded && !videoError && extractedVideoId && hasClicked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/2">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-white/60">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {videoError && hasClicked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/10">
          <div className="text-center p-4">
            <p className="text-sm text-red-300 mb-2">Video unavailable</p>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                if (shareUrl) {
                  window.open(shareUrl, '_blank', 'noopener,noreferrer')
                }
              }}
              className="text-xs text-red-200 hover:text-red-100 underline"
            >
              Open in TikTok
            </button>
          </div>
        </div>
      )}

      {/* Play/Pause button overlay */}
      {showPlayButton && (
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isHovered || isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="p-4 bg-black/60 hover:bg-black/80 rounded-full text-white transition-all duration-200 transform hover:scale-110 backdrop-blur-sm cursor-pointer">
            {isPlaying ? <FiPause className="w-8 h-8" /> : <FiPlay className="w-8 h-8 ml-1" />}
          </div>
        </div>
      )}

      {/* Video controls overlay */}
      {videoLoaded && !videoError && hasClicked && (
        <div className={`absolute bottom-2 right-2 flex gap-2 transition-all duration-300 z-20 ${
          isHovered || isPlaying ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={toggleMute}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
          </button>
          {shareUrl && (
            <button
              onClick={openInTikTok}
              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              title="Open in TikTok"
            >
              <FiExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Video info overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-all duration-300 z-10 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiVideo className="w-4 h-4 text-white/80" />
            <span className="text-xs text-white/80 font-medium">
              {videoLoaded && !videoError ? 'TikTok Video' : 'Click to Play'}
            </span>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
