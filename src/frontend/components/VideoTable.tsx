import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiVideo, FiX, FiHeart, FiMessageCircle, FiShare2, FiEye, FiTrendingUp, FiInfo, FiAlertTriangle } from 'react-icons/fi'
import type { VideoMetrics } from '../types'
import { VideoThumbnail } from './VideoThumbnail'
// import fleurLogo from '../../assets/logo.jpg' // Unused for now

interface VideoTableProps {
  videos: VideoMetrics[]
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  hasActiveFilters: () => boolean
  selectedVideo?: VideoMetrics | null
  setSelectedVideo?: (video: VideoMetrics | null) => void
  onVideoUpdate?: () => void // Callback to refresh video list when a video is updated
}

type SortKey = 'posted_at_iso' | 'view_count' | 'engagement_rate' | 'velocity_24h' | 'ai_overall_score' | 'ai_pass' | 'ai_revise' | 'ai_reshoot'
type SortDirection = 'asc' | 'desc'

// Tooltips for each AI metric
const scoreTooltips: Record<string, string> = {
  'Hook': 'First 3 seconds - How well does it grab attention?',
  'Depth': 'How much valuable information or narrative is conveyed?',
  'Clarity': 'Is the message easy to understand and follow?',
  'Pacing': 'Is the rhythm engaging? (shot changes, speech speed)',
  'CTA': 'Is there a clear, compelling call to action?',
  'Brand Fit': 'How well does it align with brand values?',
}

function VideoTable({ videos, showFilters, setShowFilters, hasActiveFilters, selectedVideo: externalSelectedVideo, setSelectedVideo: externalSetSelectedVideo, onVideoUpdate }: VideoTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('posted_at_iso')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [internalSelectedVideo, setInternalSelectedVideo] = useState<VideoMetrics | null>(null)
  
  // Use external state if provided, otherwise use internal state
  const selectedVideo = externalSelectedVideo !== undefined ? externalSelectedVideo : internalSelectedVideo
  const setSelectedVideo = externalSetSelectedVideo || setInternalSelectedVideo
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null)
  // const [captionExpanded, setCaptionExpanded] = useState(false) // Unused
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReanalyzeConfirm, setShowReanalyzeConfirm] = useState(false)
  const [videoToReanalyze, setVideoToReanalyze] = useState<VideoMetrics | null>(null)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedVideo || showDeleteConfirm || showReanalyzeConfirm) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedVideo, showDeleteConfirm])

  // const formatNumber = (num: number) => { // Unused
  //   if (num >= 1000000) {
  //     return `${(num / 1000000).toFixed(1)}M`
  //   } else if (num >= 1000) {
  //     return `${(num / 1000).toFixed(1)}K`
  //   }
  //   return num.toLocaleString()
  // }


  // First filter videos based on AI quality selection
  const filteredVideos = videos.filter((video) => {
    if (sortKey === 'ai_pass') {
      if (!video.ai_scores?.overall_100) return false
      return video.ai_scores.overall_100 >= 80
    } else if (sortKey === 'ai_revise') {
      if (!video.ai_scores?.overall_100) return false
      const score = video.ai_scores.overall_100
      return score >= 60 && score < 80
    } else if (sortKey === 'ai_reshoot') {
      if (!video.ai_scores?.overall_100) return false
      return video.ai_scores.overall_100 < 60
    }
    return true // Show all videos for other sort options
  })

  // Then sort the filtered videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    let aVal: any
    let bVal: any

    // Handle AI quality sorting
    if (sortKey === 'ai_overall_score') {
      aVal = a.ai_scores?.overall_100 || -1
      bVal = b.ai_scores?.overall_100 || -1
    } else if (sortKey === 'ai_pass' || sortKey === 'ai_revise' || sortKey === 'ai_reshoot') {
      // For AI quality bands, sort by overall score within the filtered group
      aVal = a.ai_scores?.overall_100 || -1
      bVal = b.ai_scores?.overall_100 || -1
    } else {
      aVal = a[sortKey]
      bVal = b[sortKey]
    }

    // Handle undefined values
    if (aVal === undefined) aVal = -Infinity
    if (bVal === undefined) bVal = -Infinity

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const formatFullDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatAnalysisTime = (iso: string) => {
    if (!iso) return 'Unknown'
    
    const date = new Date(iso)
    const now = new Date()
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', iso)
      return 'Invalid date'
    }
    
    const diffMs = Math.abs(now.getTime() - date.getTime()) // Use absolute value to handle timezone issues
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)
    
    // Debug logging for timezone issues - only log once per video to reduce spam
    const actualDiff = now.getTime() - date.getTime()
    if (actualDiff < 0) {
      // Only log this warning once per video to avoid spam
      const warningKey = `future_timestamp_${iso}`
      if (!sessionStorage.getItem(warningKey)) {
        console.warn('Future timestamp detected (showing absolute time):', {
          iso,
          parsedDate: date.toISOString(),
          now: now.toISOString(),
          actualDiffMs: actualDiff,
          actualDiffHours: Math.floor(actualDiff / (1000 * 60 * 60)),
          showingAbsoluteTime: true
        })
        sessionStorage.setItem(warningKey, 'true')
      }
    }
    
    if (diffYears > 0) {
      return `${diffYears}y ago`
    } else if (diffMonths > 0) {
      return `${diffMonths}mo ago`
    } else if (diffWeeks > 0) {
      return `${diffWeeks}w ago`
    } else if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`
    } else {
      return 'Just now'
    }
  }

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const [reanalyzing, setReanalyzing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteVideo = async () => {
    if (!selectedVideo) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/ai/video/${selectedVideo.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete video')
      }

      // Close modal and refresh the page
      setSelectedVideo(null)
      setShowDeleteConfirm(false)
      window.location.reload()
    } catch (error) {
      console.error('Delete error:', error)
      alert(`Failed to delete video: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setDeleting(false)
    }
  }

  const handleReanalyze = async (video: VideoMetrics) => {
    // Show custom confirmation modal
    setVideoToReanalyze(video)
    setShowReanalyzeConfirm(true)
  }

  const cancelReanalyze = () => {
    setShowReanalyzeConfirm(false)
    setVideoToReanalyze(null)
  }

  const confirmReanalyze = async () => {
    if (!videoToReanalyze) return
    
    setShowReanalyzeConfirm(false)

    setReanalyzing(true)

    try {
      // Debug logging to help identify the issue
      console.log('🔄 Re-analyzing video:', {
        id: videoToReanalyze.id,
        share_url: videoToReanalyze.share_url,
        hasShareUrl: !!videoToReanalyze.share_url
      })

      // Check if share_url exists, if not try alternative fields or construct from video ID
      let videoUrl = videoToReanalyze.share_url || (videoToReanalyze as any).shareUrl || (videoToReanalyze as any).url
      if (!videoUrl) {
        // Fallback: construct TikTok URL from video ID and username if available
        const username = videoToReanalyze.username || 'user'
        videoUrl = `https://www.tiktok.com/@${username}/video/${videoToReanalyze.id}`
        console.log('⚠️ No share_url found, using constructed URL:', videoUrl)
      }

      const response = await fetch(`/api/ai/reprocess/${videoToReanalyze.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          videoUrl: videoUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to queue re-analysis')
      }

      // Poll for completion (check every 5 seconds for up to 2 minutes)
      let attempts = 0
      const maxAttempts = 24 // 2 minutes / 5 seconds
      
      const checkStatus = async () => {
        try {
          // Determine if this is an ad-hoc video by checking if the video has is_adhoc flag
          // Ad-hoc videos are stored in database with is_adhoc=true, regular videos are from JSON
          const isAdHocVideo = !!videoToReanalyze.is_adhoc
          const endpoint = isAdHocVideo ? '/api/adhoc-analyses' : '/api/data'
          
          const statusResponse = await fetch(endpoint)
          const statusData = await statusResponse.json()
          
          if (statusData.success) {
            const updatedVideo = statusData.data.find((v: any) => v.id === videoToReanalyze.id)
            
            // Only log detailed info every 5th attempt to reduce spam
            if (attempts % 5 === 0) {
              console.log(`🔍 Checking video ${videoToReanalyze.id} (attempt ${attempts}/${maxAttempts}) via ${endpoint}:`, {
                found: !!updatedVideo,
                oldProcessedAt: videoToReanalyze.ai_processed_at,
                newProcessedAt: updatedVideo?.ai_processed_at,
                hasAIScores: !!updatedVideo?.ai_scores,
                hasVisualScores: !!updatedVideo?.ai_visual_scores,
                hasFindings: !!updatedVideo?.ai_findings,
                isAdHoc: isAdHocVideo,
                totalVideosInResponse: statusData.data?.length || 0,
                videoIdsInResponse: statusData.data?.map((v: any) => v.id).slice(0, 5) || []
              })
            }
            
            // Log on first attempt to see what we're working with
            if (attempts === 0) {
              console.log(`📊 First check - API response structure:`, {
                success: statusData.success,
                dataLength: statusData.data?.length || 0,
                lookingFor: videoToReanalyze.id,
                sampleVideoIds: statusData.data?.slice(0, 3).map((v: any) => ({ id: v.id, hasAI: !!v.scores })) || []
              })
            }
            
            // Check if analysis completed (must have AI scores AND timestamp changed)
            const hasNewAnalysis = updatedVideo && 
              updatedVideo.ai_processed_at && 
              updatedVideo.ai_processed_at !== videoToReanalyze.ai_processed_at &&
              updatedVideo.ai_scores && 
              updatedVideo.ai_visual_scores
            
            if (hasNewAnalysis) {
              // Analysis complete! Update modal with new data
              console.log('🔄 Re-analysis complete! Updating modal with new data:', updatedVideo)
              setReanalyzing(false)
              setSelectedVideo(updatedVideo)
              
              // Notify parent component to refresh video list
              if (onVideoUpdate) {
                onVideoUpdate()
              }
              return
            }
          }
          
          attempts++
          if (attempts < maxAttempts) {
            // Increase polling interval gradually to reduce load
            const delay = Math.min(5000 + (attempts * 1000), 15000)
            setTimeout(checkStatus, delay)
          } else {
            // Timeout - stop loading and show error
            console.error('⏰ Re-analysis timeout - no completion detected after 2 minutes')
            setReanalyzing(false)
            alert('⚠️ Re-analysis timed out. The analysis may have failed. Please try again or check the backend logs.')
          }
        } catch (error) {
          console.error('Status check error:', error)
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000)
          } else {
            setReanalyzing(false)
            alert('⚠️ Re-analysis failed due to network errors. Please try again.')
          }
        }
      }
      
      // Start polling after 10 seconds (give it time to process)
      setTimeout(checkStatus, 10000)
      
    } catch (error) {
      console.error('Re-analysis error:', error)
      setReanalyzing(false)
      alert(`❌ Failed to queue re-analysis:\n\n${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <>
      <div className="overflow-hidden">
        <div className="px-4 sm:px-6 py-4">
          {/* Mobile-first responsive header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title section */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center glass-card">
                <FiVideo className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Top Videos ({videos.length})
              </h2>
            </div>
            
            {/* Controls section - responsive layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3">
              {/* Filters button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-2 w-full sm:w-auto ${
                  showFilters || hasActiveFilters() 
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm font-medium">
                  Filters
                </span>
                {hasActiveFilters() && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                )}
              </button>
              
              {/* Sort section */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm text-white/70 whitespace-nowrap">Sort by:</span>
                <select 
                  value={`${sortKey}-${sortDirection}`}
                  onChange={(e) => {
                    const [key, dir] = e.target.value.split('-')
                    setSortKey(key as SortKey)
                    setSortDirection(dir as SortDirection)
                  }}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white w-full sm:w-auto min-w-[140px]"
                >
                  <option value="posted_at_iso-desc">Latest First</option>
                  <option value="view_count-desc">Most Views</option>
                  <option value="engagement_rate-desc">Best Engagement</option>
                  <option value="velocity_24h-desc">Highest Velocity</option>
                  <option disabled>──────────────</option>
                  <option value="ai_overall_score-desc">AI Score (High to Low)</option>
                  <option value="ai_pass-desc">✅ Pass (80+)</option>
                  <option value="ai_revise-desc">⚠️ Revise (60-79)</option>
                  <option value="ai_reshoot-desc">❌ Reshoot (&lt;60)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedVideos.map((video) => (
              <div 
                key={video.id}
                className="modern-card overflow-hidden cursor-pointer group"
                onClick={() => {
                  setSelectedVideo(video)
                }}
              >
                {/* Header Section */}
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    {/* Left: AI Quality Badge (if available) or Date */}
                    <div className="flex flex-col gap-1">
                      {video.ai_scores ? (
                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          video.ai_scores.overall_100 >= 80 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          video.ai_scores.overall_100 >= 60 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {video.ai_scores.overall_100 >= 80 ? '✅ Pass' :
                           video.ai_scores.overall_100 >= 60 ? '⚠️ Revise' :
                           '❌ Reshoot'}
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                          <div className="relative w-3 h-3">
                            <div className="absolute inset-0 w-3 h-3 border-2 border-blue-400/20 rounded-full animate-spin border-t-blue-400"></div>
                          </div>
                          <span>Analyzing</span>
                        </div>
                      )}
                      
                      {/* Analysis timestamp */}
                      {video.ai_processed_at && (
                        <div className="text-[10px] text-white/40 font-medium">
                          Analyzed: {formatAnalysisTime(video.ai_processed_at)}
                        </div>
                      )}
                    </div>
                    
                    {/* Right side - Engagement */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16">
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white transition-all duration-300"
                              style={{ width: `${Math.min(video.engagement_rate * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-white/70 font-bold">
                          {(video.engagement_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 uppercase tracking-wide font-medium">
                        Engagement
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video Thumbnail */}
                <div className="px-4 pt-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-lg">
                    {(video.share_url || video.embed_link || video.username) ? (
                      <a
                        href={
                          video.share_url || 
                          video.embed_link ||
                          (video.username ? `https://www.tiktok.com/@${video.username}/video/${video.id}` : '#')
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="block w-full h-full"
                        title="Open video on TikTok"
                      >
                        <VideoThumbnail 
                          coverImageUrl={video.cover_image_url} 
                          shareUrl={video.share_url}
                          videoId={video.id}
                        />
                      </a>
                    ) : (
                      <>
                        <VideoThumbnail 
                          coverImageUrl={video.cover_image_url} 
                          shareUrl={video.share_url}
                          videoId={video.id}
                        />
                      </>
                    )}
                    

                    {/* Views Badge - Top Left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-white backdrop-blur-md shadow-lg">
                        <FiEye className="w-3 h-3" />
                        {video.view_count > 1000000 
                          ? `${(video.view_count / 1000000).toFixed(1)}M`
                          : video.view_count > 1000 
                          ? `${(video.view_count / 1000).toFixed(1)}K`
                          : video.view_count.toLocaleString()
                        }
                      </span>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-white backdrop-blur-md shadow-lg">
                        {video.duration}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="px-4 pt-4 pb-5 space-y-4">

                  {/* Caption */}
                  <p className="text-sm text-white/90 line-clamp-2 leading-relaxed">
                    {truncate(video.caption, 80)}
                  </p>

                  {/* Hashtags */}
                  {video.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {video.hashtags.slice(0, 2).map((tag, i) => (
                        <span 
                          key={i}
                          className="text-[11px] text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {video.hashtags.length > 2 && (
                        <span className="text-[11px] text-white/40 font-medium">
                          +{video.hashtags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metrics - New Hierarchy */}
                  <div className="space-y-3.5">
                    {/* CENTER: AI Scores - If available */}
                    {video.ai_scores && (
                      <div className="space-y-2 pt-3.5 border-t border-white/10">
                        {/* AI Overall Score at top */}
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wide">AI Score</span>
                          <span className={`text-base font-bold tabular-nums ${
                            video.ai_scores.overall_100 >= 80 ? 'text-green-400' :
                            video.ai_scores.overall_100 >= 60 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {video.ai_scores.overall_100}<span className="text-xs text-white/50">/100</span>
                          </span>
                        </div>

                        {Object.entries({
                          'Hook': video.ai_scores.hook_strength,
                          'Depth': video.ai_scores.depth,
                          'Clarity': video.ai_scores.clarity,
                          'Pacing': video.ai_scores.pacing,
                          'CTA': video.ai_scores.cta,
                          'Brand Fit': video.ai_scores.brand_fit,
                        }).map(([label, score]) => {
                          const tooltipId = `${video.id}-${label}`
                          return (
                            <div key={label} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 relative group/tooltip">
                                <span className="text-[11px] md:text-xs text-white/70 font-medium">{label}</span>
                                <div 
                                  className="cursor-help"
                                  onMouseEnter={() => setHoveredTooltip(tooltipId)}
                                  onMouseLeave={() => setHoveredTooltip(null)}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FiInfo className="w-2.5 h-2.5 text-white/30 hover:text-white/60 transition-colors" />
                                </div>
                                {/* Tooltip */}
                                {hoveredTooltip === tooltipId && (
                                  <div className="absolute left-0 bottom-full mb-2 z-50 w-48 px-3 py-2 bg-black/95 text-white text-[10px] rounded-lg shadow-xl border border-white/10 pointer-events-none">
                                    {scoreTooltips[label]}
                                    <div className="absolute left-4 top-full w-2 h-2 bg-black/95 border-r border-b border-white/10 transform rotate-45 -mt-1"></div>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-16 md:w-18 h-1.5 bg-white/15 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ease-out ${
                                      score >= 7 ? 'bg-green-400' :
                                      score >= 5 ? 'bg-yellow-400' :
                                      'bg-red-400'
                                    }`}
                                    style={{ width: `${(score / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[11px] md:text-xs font-bold text-white/90 w-4 text-right tabular-nums">
                                  {score}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* BOTTOM: Social Metrics */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      {/* Bottom Left: Likes, Comments, Shares */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <FiHeart className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-white font-bold tabular-nums">
                            {video.like_count > 1000 
                              ? `${(video.like_count / 1000).toFixed(0)}K`
                              : video.like_count.toLocaleString()
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiMessageCircle className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-white font-bold tabular-nums">
                            {video.comment_count > 1000 
                              ? `${(video.comment_count / 1000).toFixed(0)}K`
                              : video.comment_count.toLocaleString()
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiShare2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-white font-bold tabular-nums">
                            {video.share_count > 1000 
                              ? `${(video.share_count / 1000).toFixed(0)}K`
                              : video.share_count.toLocaleString()
                            }
                          </span>
                        </div>
                      </div>

                      {/* Bottom Right: Velocity - Ensure perfect alignment */}
                      <div className="flex items-center gap-1">
                        <FiTrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-white font-bold tabular-nums leading-none">
                          {video.velocity_24h ? video.velocity_24h.toFixed(0) : '0'}/hr
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {videos.length === 0 && (
            <div className="text-center py-12 text-white/50">
              <FiVideo className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <p className="text-lg font-medium">No videos found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Video Detail Modal */}
      {selectedVideo && createPortal(
        <div 
          className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/50 to-black/70 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            zIndex: 999999,
            width: '100vw',
            height: '100vh'
          }}
        >
          <div 
            className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-2xl border border-white/25 rounded-2xl w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              maxHeight: '90vh',
              width: '90vw',
              maxWidth: '900px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Close button in top right */}
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm z-50"
            >
              <FiX className="w-4 h-4 text-white/80" />
            </button>

            {/* Reanalyzing Overlay */}
            {reanalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 rounded-2xl">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl p-8 max-w-md text-center shadow-2xl">
                  <div className="w-16 h-16 border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold text-white mb-2">Re-analyzing Video...</h3>
                  <p className="text-white/60 mb-4">
                    Running AI analysis with improved scoring model
                  </p>
                  <div className="space-y-2 text-sm text-white/50">
                    <p>⏱️ This will take 30-60 seconds</p>
                    <p>🤖 Using GPT-4o for better accuracy</p>
                    <p>♻️ Page will auto-refresh when complete</p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 lg:p-6 pt-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                {/* Left Column - Video & Basic Info */}
                <div className="xl:col-span-1 space-y-4">
                  {/* Video Player/Thumbnail */}
                  {selectedVideo.cover_image_url && (
                    <div className="bg-gray-800/80 backdrop-blur-sm border border-white/15 rounded-xl overflow-hidden">
                      <div className="w-full h-[250px] lg:h-[300px] relative">
                        <VideoThumbnail 
                          coverImageUrl={selectedVideo.cover_image_url} 
                          shareUrl={selectedVideo.share_url}
                          videoId={selectedVideo.id}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Views Badge - Top Left */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-white backdrop-blur-md shadow-lg">
                            <FiEye className="w-3 h-3" />
                            {selectedVideo.view_count >= 1000000 
                              ? `${(selectedVideo.view_count / 1000000).toFixed(1)}M`
                              : selectedVideo.view_count >= 1000 
                              ? `${(selectedVideo.view_count / 1000).toFixed(1)}K`
                              : selectedVideo.view_count.toLocaleString()}
                          </span>
                        </div>

                        {/* Duration Badge - Bottom Right */}
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-white backdrop-blur-md shadow-lg">
                            {selectedVideo.duration}s
                          </span>
                        </div>
                      </div>
                      
                      {/* Caption & Hashtags */}
                      <div className="p-4 space-y-3">
                        {/* Caption */}
                        <p className="text-sm text-white/90 leading-relaxed line-clamp-3">
                          {selectedVideo.caption}
                        </p>

                        {/* Hashtags */}
                        {selectedVideo.hashtags && selectedVideo.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedVideo.hashtags.slice(0, 4).map((tag, i) => (
                              <span 
                                key={i}
                                className="text-[11px] text-white/70 bg-white/10 px-2.5 py-0.5 rounded-full font-medium"
                              >
                                #{tag}
                              </span>
                            ))}
                            {selectedVideo.hashtags.length > 4 && (
                              <span className="text-[11px] text-white/40 font-medium">
                                +{selectedVideo.hashtags.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Performance & Details */}
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-white/15 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white/70 mb-4">Performance & Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Views</span>
                        <span className="text-white font-bold">
                          {selectedVideo.view_count >= 1000000 
                            ? `${(selectedVideo.view_count / 1000000).toFixed(1)}M`
                            : selectedVideo.view_count >= 1000 
                            ? `${(selectedVideo.view_count / 1000).toFixed(1)}K`
                            : selectedVideo.view_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Likes</span>
                        <span className="text-white font-bold">
                          {selectedVideo.like_count >= 1000000 
                            ? `${(selectedVideo.like_count / 1000000).toFixed(1)}M`
                            : selectedVideo.like_count >= 1000 
                            ? `${(selectedVideo.like_count / 1000).toFixed(1)}K`
                            : selectedVideo.like_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Comments</span>
                        <span className="text-white font-bold">
                          {selectedVideo.comment_count >= 1000000 
                            ? `${(selectedVideo.comment_count / 1000000).toFixed(1)}M`
                            : selectedVideo.comment_count >= 1000 
                            ? `${(selectedVideo.comment_count / 1000).toFixed(1)}K`
                            : selectedVideo.comment_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">Shares</span>
                        <span className="text-white font-bold">
                          {selectedVideo.share_count >= 1000000 
                            ? `${(selectedVideo.share_count / 1000000).toFixed(1)}M`
                            : selectedVideo.share_count >= 1000 
                            ? `${(selectedVideo.share_count / 1000).toFixed(1)}K`
                            : selectedVideo.share_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">Engagement</span>
                          <span className="text-white font-bold text-lg">
                            {(selectedVideo.engagement_rate * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60 text-sm">Posted</span>
                          <span className="text-white text-xs">{formatFullDate(selectedVideo.posted_at_iso)}</span>
                        </div>
                        {selectedVideo.velocity_24h !== undefined && selectedVideo.velocity_24h !== null && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-sm">24h Velocity</span>
                            <span className="text-white font-medium">{selectedVideo.velocity_24h.toFixed(0)}/hr</span>
                          </div>
                        )}
                      </div>

                      {/* Re-analyze Button */}
                      {selectedVideo.ai_scores && (
                        <div className="pt-3 border-t border-white/10">
                          <button
                            onClick={() => handleReanalyze(selectedVideo)}
                            className="w-full px-4 py-2.5 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all backdrop-blur-sm text-yellow-400 text-sm font-medium"
                          >
                            Re-analyze
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - AI Analysis */}
                <div className="xl:col-span-2 space-y-4 lg:space-y-6">
                  {/* AI Analysis Section */}
                  {selectedVideo.ai_scores && (
                    <div className="space-y-6">
                      {/* Overall Score Card with Content Scores */}
                      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">Overall Score</h3>
                          <div className={`px-4 py-2 rounded-full text-sm font-bold border ${
                            selectedVideo.ai_scores.overall_100 >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            selectedVideo.ai_scores.overall_100 >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {selectedVideo.ai_scores.overall_100 >= 80 ? '✅ Pass' :
                             selectedVideo.ai_scores.overall_100 >= 60 ? '⚠️ Revise' :
                             '❌ Reshoot'}
                          </div>
                        </div>
                        <div className="text-6xl font-bold text-white mb-4">
                          {selectedVideo.ai_scores.overall_100}
                          <span className="text-2xl text-white/40">/100</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden mb-6">
                          <div
                            className={`h-full transition-all ${
                              selectedVideo.ai_scores.overall_100 >= 80 ? 'bg-green-500' :
                              selectedVideo.ai_scores.overall_100 >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${selectedVideo.ai_scores.overall_100}%` }}
                          />
                        </div>

                        {/* Content Scores - Inline in same card */}
                        <div className="pt-4 border-t border-white/10">
                          <h4 className="text-sm font-bold text-white/80 mb-3">Content Breakdown</h4>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
                            {Object.entries({
                              'Hook': selectedVideo.ai_scores.hook_strength,
                              'Depth': selectedVideo.ai_scores.depth,
                              'Clarity': selectedVideo.ai_scores.clarity,
                              'Pacing': selectedVideo.ai_scores.pacing,
                              'CTA': selectedVideo.ai_scores.cta,
                              'Brand Fit': selectedVideo.ai_scores.brand_fit,
                            }).map(([label, score]) => (
                              <div key={label} className="bg-slate-900/50 rounded-lg p-3">
                                <div className="text-white/60 text-xs md:text-sm mb-1">{label}</div>
                                <div className="text-xl md:text-2xl font-bold text-white mb-2">
                                  {score}<span className="text-xs md:text-sm text-white/40">/10</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ease-out ${
                                      score >= 7 ? 'bg-green-400' :
                                      score >= 5 ? 'bg-yellow-400' :
                                      'bg-red-400'
                                    }`}
                                    style={{ width: `${(score / 10) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Key Findings */}
                      {selectedVideo.ai_findings && (Object.values(selectedVideo.ai_findings).some((v: any) => v && v.trim())) && (
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-white mb-4">Key Findings</h3>
                          <div className="space-y-3">
                            {selectedVideo.ai_findings.hook_strength && (
                              <div>
                                <span className="text-white/60 text-sm font-medium">Hook Analysis:</span>
                                <p className="text-white/90 mt-1">{selectedVideo.ai_findings.hook_strength}</p>
                              </div>
                            )}
                            {selectedVideo.ai_findings.depth && (
                              <div>
                                <span className="text-white/60 text-sm font-medium">Depth Analysis:</span>
                                <p className="text-white/90 mt-1">{selectedVideo.ai_findings.depth}</p>
                              </div>
                            )}
                            {selectedVideo.ai_findings.cta && (
                              <div>
                                <span className="text-white/60 text-sm font-medium">CTA Analysis:</span>
                                <p className="text-white/90 mt-1">{selectedVideo.ai_findings.cta}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {selectedVideo.ai_fix_suggestions && selectedVideo.ai_fix_suggestions.length > 0 && (
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-white mb-4">Suggestions</h3>
                          <ul className="space-y-2">
                            {selectedVideo.ai_fix_suggestions.map((suggestion: string, idx: number) => (
                              <li key={idx} className="text-white/80 flex items-start gap-2">
                                <span className="text-blue-400 mt-1">→</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Visual Scores with Progress Bars - Moved to Bottom */}
                      {selectedVideo.ai_visual_scores && (
                        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-white mb-4">Visual Analysis</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries({
                              'Thumbstop': selectedVideo.ai_visual_scores.thumbstop_prob,
                              'First Frame': selectedVideo.ai_visual_scores.first_frame_strength,
                              'Silent Comp.': selectedVideo.ai_visual_scores.silent_comprehension,
                              'Aesthetics': selectedVideo.ai_visual_scores.visual_aesthetics,
                              'Composition': selectedVideo.ai_visual_scores.composition,
                              'Motion': selectedVideo.ai_visual_scores.motion_dynamics,
                              'Pattern Int.': selectedVideo.ai_visual_scores.pattern_interrupt,
                              'Text Legibility': selectedVideo.ai_visual_scores.text_legibility,
                              'Emotion': selectedVideo.ai_visual_scores.emotion_score,
                              'Save Trigger': selectedVideo.ai_visual_scores.save_share_trigger,
                              'Loopability': selectedVideo.ai_visual_scores.loopability,
                              'Trend Align': selectedVideo.ai_visual_scores.trend_alignment,
                            }).map(([label, score]) => (
                              <div key={label} className="bg-slate-900/50 rounded-lg p-3">
                                <div className="text-white/60 text-xs md:text-sm mb-1">{label}</div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all ${
                                        score >= 8 ? 'bg-green-500' :
                                        score >= 6 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${score * 10}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-bold text-white tabular-nums min-w-[28px]">
                                    {score.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delete Button */}
                      <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-4">
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all backdrop-blur-sm text-red-400 text-sm font-medium"
                        >
                          Delete Video
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999999 }}
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div 
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <FiAlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Delete Video</h3>
                  <p className="text-white/60 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-white/90 mb-2">
                  Are you sure you want to delete this video and all its analysis data?
                </p>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">
                    ⚠️ This will permanently remove:
                  </p>
                  <ul className="text-red-400/80 text-sm mt-1 ml-4 list-disc">
                    <li>Video metadata and performance data</li>
                    <li>All AI analysis results</li>
                    <li>Visual analysis scores</li>
                    <li>Key findings and suggestions</li>
                  </ul>
                </div>
              </div>

              {deleting ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  <span className="text-white/80">Deleting video...</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteVideo}
                    className="flex-1 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-medium rounded-lg transition-colors"
                  >
                    Delete Video
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Re-analyze Confirmation Modal */}
      {showReanalyzeConfirm && videoToReanalyze && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ zIndex: 9999999 }}
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              cancelReanalyze();
            }
          }}
        >
          <div 
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Re-analyze Video</h3>
                  <p className="text-white/60 text-sm">This action will overwrite existing analysis</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-white/90 mb-2">
                  Are you sure you want to re-analyze this video with the latest AI model?
                </p>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-blue-400 text-sm">
                    ⚠️ This will permanently overwrite:
                  </p>
                  <ul className="text-blue-400/80 text-sm mt-1 ml-4 list-disc">
                    <li>Current AI analysis results</li>
                    <li>Visual analysis scores</li>
                    <li>Key findings and suggestions</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelReanalyze}
                  className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReanalyze}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-blue-500/25"
                >
                  Re-analyze Video
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default VideoTable
