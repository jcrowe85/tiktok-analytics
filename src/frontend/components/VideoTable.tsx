import { useState } from 'react'
import { FiVideo, FiX, FiHeart, FiMessageCircle, FiShare2, FiEye, FiTrendingUp, FiInfo } from 'react-icons/fi'
import type { VideoMetrics } from '../types'
import { VideoThumbnail } from './VideoThumbnail'
// import fleurLogo from '../../assets/logo.jpg' // Unused for now

interface VideoTableProps {
  videos: VideoMetrics[]
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  hasActiveFilters: () => boolean
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

function VideoTable({ videos, showFilters, setShowFilters, hasActiveFilters }: VideoTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('posted_at_iso')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedVideo, setSelectedVideo] = useState<VideoMetrics | null>(null)
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null)
  const [captionExpanded, setCaptionExpanded] = useState(false)

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }


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
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      if (diffMinutes > 0) {
        return `${diffMinutes}m ago`
      } else {
        return 'Just now'
      }
    }
  }

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const handleReanalyze = async (video: VideoMetrics) => {
    // Show confirmation dialog with cost warning
    const confirmed = window.confirm(
      `⚠️ RE-ANALYZE WARNING\n\n` +
      `This video was already analyzed ${video.ai_processed_at ? formatAnalysisTime(video.ai_processed_at) : 'previously'}.\n\n` +
      `Re-analyzing will:\n` +
      `• Use OpenAI API credits (~$0.10-0.50)\n` +
      `• Take 30-60 seconds to complete\n` +
      `• Overwrite existing analysis\n\n` +
      `⚠️ Only re-analyze if you have a specific reason (e.g., video content changed, testing improvements).\n\n` +
      `Do you want to continue?`
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/ai/reprocess/${video.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          videoUrl: video.share_url 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to queue re-analysis')
      }

      // Show success message
      alert(`✅ Video queued for re-analysis!\n\nThe analysis will complete in 30-60 seconds. Refresh the page to see updated results.`)
      
      // Close modal
      setSelectedVideo(null)
    } catch (error) {
      console.error('Re-analysis error:', error)
      alert(`❌ Failed to queue re-analysis:\n\n${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <>
      <div className="overflow-hidden">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center glass-card">
                <FiVideo className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Top Videos ({videos.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1 rounded-lg border transition-all flex items-center gap-2 ${
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
              <span className="text-sm text-white/70">Sort by:</span>
              <select 
                value={`${sortKey}-${sortDirection}`}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split('-')
                  setSortKey(key as SortKey)
                  setSortDirection(dir as SortDirection)
                }}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white"
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

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedVideos.map((video) => (
              <div 
                key={video.id}
                className="modern-card overflow-hidden cursor-pointer group"
                onClick={() => {
                  setSelectedVideo(video)
                  setCaptionExpanded(false) // Reset caption expansion when selecting new video
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
                        <span className="text-xs text-white/70 font-semibold">
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
                        <VideoThumbnail coverImageUrl={video.cover_image_url} />
                      </a>
                    ) : (
                      <>
                        <VideoThumbnail coverImageUrl={video.cover_image_url} />
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
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wide">🧠 AI Score</span>
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
                            <div key={label} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1 relative group/tooltip">
                                <span className="text-[11px] text-white/60 font-medium">{label}</span>
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
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 ease-out ${
                                      score >= 7 ? 'bg-green-400' :
                                      score >= 5 ? 'bg-yellow-400' :
                                      'bg-red-400'
                                    }`}
                                    style={{ width: `${(score / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-white/90 w-6 text-right tabular-nums">
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
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-0.5">
                          <FiHeart className="w-3 h-3 text-red-400/80" />
                          <span className="text-[11px] text-white/70 font-medium tabular-nums">
                            {video.like_count > 1000 
                              ? `${(video.like_count / 1000).toFixed(0)}K`
                              : video.like_count.toLocaleString()
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <FiMessageCircle className="w-3 h-3 text-blue-400/80" />
                          <span className="text-[11px] text-white/70 font-medium tabular-nums">
                            {video.comment_count > 1000 
                              ? `${(video.comment_count / 1000).toFixed(0)}K`
                              : video.comment_count.toLocaleString()
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <FiShare2 className="w-3 h-3 text-green-400/80" />
                          <span className="text-[11px] text-white/70 font-medium tabular-nums">
                            {video.share_count > 1000 
                              ? `${(video.share_count / 1000).toFixed(0)}K`
                              : video.share_count.toLocaleString()
                            }
                          </span>
                        </div>
                      </div>

                      {/* Bottom Right: Velocity - Ensure perfect alignment */}
                      <div className="flex items-center gap-0.5 h-[18px]">
                        <FiTrendingUp className="w-3 h-3 text-purple-400/80" />
                        <span className="text-[11px] text-white/70 font-medium tabular-nums leading-none">
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
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 p-6 z-20 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FiVideo className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Video Analytics
                    </h3>
                    <p className="text-sm text-white/60 font-medium">
                      Detailed performance insights
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedVideo.ai_scores && (
                    <button
                      onClick={() => handleReanalyze(selectedVideo)}
                      className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all backdrop-blur-sm text-yellow-400 text-sm font-medium flex items-center gap-2"
                      title="Re-analyze this video"
                    >
                      🔄 Re-analyze
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all backdrop-blur-sm"
                  >
                    <FiX className="w-4 h-4 text-white/80" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Video & Basic Info */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Video Player/Thumbnail */}
                  {selectedVideo.cover_image_url ? (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                      <div className="w-full h-[300px] rounded-lg overflow-hidden relative">
                        <VideoThumbnail 
                          coverImageUrl={selectedVideo.cover_image_url} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Basic Info */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white/70 mb-3">Video Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">Posted</span>
                        <span className="text-white font-medium">{formatFullDate(selectedVideo.posted_at_iso)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">Duration</span>
                        <span className="text-white font-medium">{selectedVideo.duration}s</span>
                      </div>
                      {selectedVideo.velocity_24h && (
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">24h Velocity</span>
                          <span className="text-white font-medium">{selectedVideo.velocity_24h.toFixed(0)}/hr</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-white/70 mb-3">Caption</h4>
                    <p className={`text-white/90 text-sm leading-relaxed ${!captionExpanded && selectedVideo.caption.length > 200 ? 'line-clamp-4' : ''}`}>
                      {!captionExpanded && selectedVideo.caption.length > 200 
                        ? `${selectedVideo.caption.substring(0, 200)}...` 
                        : selectedVideo.caption
                      }
                    </p>
                    {selectedVideo.caption.length > 200 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setCaptionExpanded(!captionExpanded)
                        }}
                        className="text-blue-400 text-xs mt-2 hover:text-blue-300 transition-colors"
                      >
                        {captionExpanded ? 'Show less' : 'Show full caption'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column - Metrics & AI Analysis */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Key Performance Metrics */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      📊 Performance Metrics
                    </h4>
                    
                    {/* Primary Metrics */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <div className="text-3xl font-bold text-white mb-1">
                          {formatNumber(selectedVideo.view_count)}
                        </div>
                        <div className="text-sm text-white/70 font-medium">Total Views</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <div className="text-3xl font-bold text-white mb-1">
                          {(selectedVideo.engagement_rate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-white/70 font-medium">Engagement Rate</div>
                      </div>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <div className="text-xl font-bold text-white mb-1">
                          {formatNumber(selectedVideo.like_count)}
                        </div>
                        <div className="text-xs text-white/60">Likes</div>
                        <div className="text-xs text-white/50">
                          {(selectedVideo.like_rate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <div className="text-xl font-bold text-white mb-1">
                          {formatNumber(selectedVideo.comment_count)}
                        </div>
                        <div className="text-xs text-white/60">Comments</div>
                        <div className="text-xs text-white/50">
                          {(selectedVideo.comment_rate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <div className="text-xl font-bold text-white mb-1">
                          {formatNumber(selectedVideo.share_count)}
                        </div>
                        <div className="text-xs text-white/60">Shares</div>
                        <div className="text-xs text-white/50">
                          {(selectedVideo.share_rate * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis Section */}
                  {selectedVideo.ai_scores && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          🧠 AI Creative Intelligence
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-lg text-2xl font-bold ${
                            selectedVideo.ai_scores.overall_100 >= 80 ? 'bg-green-500/30 text-green-400 border border-green-500/40' :
                            selectedVideo.ai_scores.overall_100 >= 60 ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/40' :
                            'bg-red-500/30 text-red-400 border border-red-500/40'
                          }`}>
                            {selectedVideo.ai_scores.overall_100}/100
                          </span>
                        </div>
                      </div>

                      {/* Quality Assessment */}
                      <div className="mb-6 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white/70">Quality Assessment:</span>
                          <span className={`font-bold text-sm px-3 py-1 rounded-lg ${
                            selectedVideo.ai_scores.overall_100 >= 80 ? 'bg-green-500/30 text-green-400' :
                            selectedVideo.ai_scores.overall_100 >= 60 ? 'bg-yellow-500/30 text-yellow-400' :
                            'bg-red-500/30 text-red-400'
                          }`}>
                            {selectedVideo.ai_scores.overall_100 >= 80 ? '✅ PASS - Publish as-is' :
                             selectedVideo.ai_scores.overall_100 >= 60 ? '⚠️ REVISE - Minor improvements needed' :
                             '❌ RESHOOT - Major issues detected'}
                          </span>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedVideo.ai_scores)
                          .filter(([key]) => key !== 'overall_100')
                          .map(([key, value]) => (
                            <div key={key} className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white/80 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm font-bold text-white">
                                  {value}/10
                                </span>
                              </div>
                              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${
                                    value >= 7 ? 'bg-green-400' :
                                    value >= 5 ? 'bg-yellow-400' :
                                    'bg-red-400'
                                  }`}
                                  style={{ width: `${(value / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* AI Findings & Suggestions */}
                      <div className="mt-6 space-y-4">
                        {/* Fix Suggestions */}
                        {selectedVideo.ai_fix_suggestions && selectedVideo.ai_fix_suggestions.length > 0 && (
                          <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                            <h5 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                              🔧 Actionable Suggestions
                            </h5>
                            <div className="space-y-2">
                              {selectedVideo.ai_fix_suggestions.slice(0, 3).map((suggestion, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-white/80">
                                  <span className="text-green-400 font-bold text-xs mt-0.5">{idx + 1}.</span>
                                  <span>{suggestion}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Findings */}
                        {selectedVideo.ai_findings && (
                          <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                            <h5 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                              💡 AI Insights
                            </h5>
                            <div className="space-y-2">
                              {Object.entries(selectedVideo.ai_findings).slice(0, 3).map(([key, finding]) => (
                                <div key={key} className="text-sm text-white/80">
                                  <span className="font-medium text-white/60 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </span>
                                  <span className="ml-2">{finding}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Visual Scores (Advanced) Section */}
                  {selectedVideo.ai_scores && (
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </span>
                          Visual Scores (Advanced)
                        </h4>
                        <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Visual Score Items */}
                        <div className="space-y-3">
                          {/* Composition */}
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">Composition</span>
                            <span className="text-white/60 text-sm font-medium">7/10</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 transition-all duration-500" style={{ width: '70%' }} />
                          </div>

                          {/* Loopability */}
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">Loopability</span>
                            <span className="text-white/60 text-sm font-medium">6/10</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: '60%' }} />
                          </div>

                          {/* Emotion Score */}
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">Emotion Score</span>
                            <span className="text-white/60 text-sm font-medium">8/10</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 transition-all duration-500" style={{ width: '80%' }} />
                          </div>

                          {/* Thumbstop Prob */}
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">Thumbstop Prob</span>
                            <span className="text-white/60 text-sm font-medium">8/10</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 transition-all duration-500" style={{ width: '80%' }} />
                          </div>

                          {/* Motion Dynamics */}
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">Motion Dynamics</span>
                            <span className="text-white/60 text-sm font-medium">6/10</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: '60%' }} />
                          </div>

                          {/* Text Legibility */}
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">Text Legibility</span>
                            <span className="text-white/60 text-sm font-medium">8/10</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 transition-all duration-500" style={{ width: '80%' }} />
                          </div>
                        </div>

                        {/* View Full JSON Analysis Button */}
                        <div className="pt-4 border-t border-white/10">
                          <button className="w-full bg-blue-600/30 hover:bg-blue-600/50 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-blue-500/30">
                            View Full JSON Analysis
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default VideoTable
