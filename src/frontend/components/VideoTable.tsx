import { useState } from 'react'
import { FiVideo, FiX, FiHeart, FiMessageCircle, FiShare2, FiEye, FiTrendingUp } from 'react-icons/fi'
import type { VideoMetrics } from '../types'
import fleurLogo from '../../assets/logo.jpg'

interface VideoTableProps {
  videos: VideoMetrics[]
}

type SortKey = 'posted_at_iso' | 'view_count' | 'engagement_rate' | 'velocity_24h'
type SortDirection = 'asc' | 'desc'

function VideoTable({ videos }: VideoTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('posted_at_iso')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedVideo, setSelectedVideo] = useState<VideoMetrics | null>(null)

  const sortedVideos = [...videos].sort((a, b) => {
    let aVal: any = a[sortKey]
    let bVal: any = b[sortKey]

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

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }


  // Format caption with clickable hashtags and links
  const formatCaption = (caption: string) => {
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0

    // Match hashtags and URLs
    const regex = /(#\w+)|(https?:\/\/[^\s]+)/g
    let match

    while ((match = regex.exec(caption)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(caption.substring(lastIndex, match.index))
      }

      if (match[1]) {
        // Hashtag
        const hashtag = match[1]
        parts.push(
          <a
            key={match.index}
            href={`https://www.tiktok.com/tag/${hashtag.substring(1)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white underline"
            onClick={(e) => e.stopPropagation()}
          >
            {hashtag}
          </a>
        )
      } else if (match[2]) {
        // URL
        const url = match[2]
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white underline"
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < caption.length) {
      parts.push(caption.substring(lastIndex))
    }

    return <>{parts}</>
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
            <div className="flex items-center gap-2">
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
              </select>
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedVideos.map((video) => (
              <div 
                key={video.id}
                className="glass-card rounded-xl overflow-hidden hover:ring-2 hover:ring-white/20 transition-all cursor-pointer group"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Header Section */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    {/* Fleur Logo on the left */}
                    <img 
                      src={fleurLogo} 
                      alt="Fleur Logo"
                      className="w-12 h-12 object-cover shadow-lg rounded-full flex-shrink-0"
                    />
                    
                    {/* Right side - Engagement bar, TikTok icon and timestamp */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {/* Top row - Engagement bar and TikTok Logo */}
                      <div className="flex items-center gap-2">
                        {/* Engagement Progress Bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-16">
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-white transition-all duration-300"
                                style={{ width: `${Math.min(video.engagement_rate * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-white/70 font-medium">
                            {(video.engagement_rate * 100).toFixed(1)}%
                          </span>
                        </div>
                        
                        {/* TikTok Logo */}
                        <div className="w-7 h-7 rounded bg-black flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white">
                            <path fill="currentColor" d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.942-1.304-2.077-1.304-3.338V.936h-3.18v13.66c0 1.9-1.54 3.44-3.44 3.44s-3.44-1.54-3.44-3.44 1.54-3.44 3.44-3.44c.353 0 .694.053 1.013.153v-3.27a6.67 6.67 0 0 0-1.013-.078c-3.67 0-6.64 2.97-6.64 6.64s2.97 6.64 6.64 6.64 6.64-2.97 6.64-6.64V8.247c1.27.78 2.7 1.2 4.18 1.2v-3.18c-1.03 0-2.01-.35-2.78-.98z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="text-xs text-white/60 whitespace-nowrap">
                        {formatFullDate(video.posted_at_iso)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Thumbnail */}
                <div className="p-3">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
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
                        {video.cover_image_url ? (
                          <img 
                            src={video.cover_image_url} 
                            alt="Video thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                            <FiVideo className="w-12 h-12 text-white/40" />
                          </div>
                        )}
                      </a>
                    ) : (
                      <>
                        {video.cover_image_url ? (
                          <img 
                            src={video.cover_image_url} 
                            alt="Video thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                            <FiVideo className="w-12 h-12 text-white/40" />
                          </div>
                        )}
                      </>
                    )}
                    

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                        {video.duration}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3">

                  {/* Caption */}
                  <p className="text-sm text-white line-clamp-2 leading-relaxed">
                    {truncate(video.caption, 80)}
                  </p>

                  {/* Hashtags */}
                  {video.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {video.hashtags.slice(0, 2).map((tag, i) => (
                        <span 
                          key={i}
                          className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {video.hashtags.length > 2 && (
                        <span className="text-xs text-white/50">
                          +{video.hashtags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    {/* Views */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiEye className="w-4 h-4 text-white/60" />
                        <div>
                          <div className="text-sm font-semibold text-white">Views</div>
                          <div className="w-full h-px border-dotted border-white/20 mt-1"></div>
                        </div>
                      </div>
                      <div className="text-sm text-white">
                        {video.view_count > 1000000 
                          ? `${(video.view_count / 1000000).toFixed(1)}M`
                          : video.view_count > 1000 
                          ? `${(video.view_count / 1000).toFixed(1)}K`
                          : video.view_count.toLocaleString()
                        }
                      </div>
                    </div>

                    {/* Likes */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiHeart className="w-4 h-4 text-red-400" />
                        <div>
                          <div className="text-sm text-white/80">Likes</div>
                          <div className="w-full h-px border-dotted border-white/20 mt-1"></div>
                        </div>
                      </div>
                      <div className="text-sm text-white">
                        {video.like_count > 1000000 
                          ? `${(video.like_count / 1000000).toFixed(1)}M`
                          : video.like_count > 1000 
                          ? `${(video.like_count / 1000).toFixed(1)}K`
                          : video.like_count.toLocaleString()
                        }
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiMessageCircle className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-sm text-white/80">Comments</div>
                          <div className="w-full h-px border-dotted border-white/20 mt-1"></div>
                        </div>
                      </div>
                      <div className="text-sm text-white">
                        {video.comment_count > 1000 
                          ? `${(video.comment_count / 1000).toFixed(1)}K`
                          : video.comment_count.toLocaleString()
                        }
                      </div>
                    </div>

                    {/* Shares */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiShare2 className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-sm text-white/80">Shares</div>
                          <div className="w-full h-px border-dotted border-white/20 mt-1"></div>
                        </div>
                      </div>
                      <div className="text-sm text-white">
                        {video.share_count > 1000 
                          ? `${(video.share_count / 1000).toFixed(1)}K`
                          : video.share_count.toLocaleString()
                        }
                      </div>
                    </div>

                    {/* Engagement Rate */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiTrendingUp className="w-4 h-4 text-yellow-400" />
                        <div>
                          <div className="text-sm text-white/80">Engagement</div>
                          <div className="w-full h-px border-dotted border-white/20 mt-1"></div>
                        </div>
                      </div>
                      <div className="text-sm text-white">
                        {(video.engagement_rate * 100).toFixed(1)}%
                      </div>
                    </div>

                    {/* Velocity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiTrendingUp className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="text-sm text-white/80">Velocity</div>
                          <div className="w-full h-px border-dotted border-white/20 mt-1"></div>
                        </div>
                      </div>
                      <div className="text-sm text-white">
                        {video.velocity_24h ? video.velocity_24h.toFixed(0) : '0'}/hr
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

      {/* Video Detail Modal */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedVideo(null)}
        >
          {/* Background Image */}
          <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
            style={{ backgroundImage: 'url(/dashboard.png)' }}
          />
          <div 
            className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-fleur-border-strong relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Video Details</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* TikTok Embed Player */}
                {selectedVideo.username ? (
                  <div className="flex justify-center">
                    <div className="w-[300px] h-[533px] rounded-lg border border-fleur-border overflow-hidden bg-black/20">
                      <iframe
                        src={`https://www.tiktok.com/embed/v2/${selectedVideo.id}?lang=en`}
                        className="w-full h-full"
                        allowFullScreen
                        scrolling="no"
                        allow="encrypted-media;"
                      />
                    </div>
                  </div>
                ) : selectedVideo.cover_image_url ? (
                  <div className="flex justify-center">
                    <div className="w-[400px] h-[300px] rounded-lg overflow-hidden">
                      <img 
                        src={selectedVideo.cover_image_url} 
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <h4 className="text-sm font-semibold text-white/70 mb-1">Caption</h4>
                  <p className="text-white whitespace-pre-wrap leading-relaxed">
                    {formatCaption(selectedVideo.caption)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-white/70 mb-1">Posted</h4>
                    <p className="text-white font-semibold">{formatFullDate(selectedVideo.posted_at_iso)}</p>
                  </div>
                  <div className="glass-card p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-white/70 mb-1">Duration</h4>
                    <p className="text-white font-semibold">{selectedVideo.duration}s</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-white/70 mb-1">Views</h4>
                    <p className="text-white text-lg font-bold">
                      {selectedVideo.view_count.toLocaleString()}
                    </p>
                  </div>
                  <div className="glass-card p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-white/70 mb-1">Engagement Rate</h4>
                    <p className="text-white text-lg font-bold">
                      {(selectedVideo.engagement_rate * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-white/70 mb-1">Likes</h4>
                    <p className="text-white font-bold">{selectedVideo.like_count.toLocaleString()}</p>
                    <p className="text-xs text-white/60">
                      {(selectedVideo.like_rate * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="glass-card p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-white/70 mb-1">Comments</h4>
                    <p className="text-white font-bold">{selectedVideo.comment_count.toLocaleString()}</p>
                    <p className="text-xs text-white/60">
                      {(selectedVideo.comment_rate * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="glass-card p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-white/70 mb-1">Shares</h4>
                    <p className="text-white font-bold">{selectedVideo.share_count.toLocaleString()}</p>
                    <p className="text-xs text-white/60">
                      {(selectedVideo.share_rate * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>

                {selectedVideo.velocity_24h && (
                  <div className="glass-card p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-white/70 mb-1">24h Velocity</h4>
                    <p className="text-white font-bold">
                      {selectedVideo.velocity_24h.toFixed(0)} views/hour
                    </p>
                  </div>
                )}

                {selectedVideo.hashtags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-white/70 mb-2">Hashtags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.hashtags.map((tag, i) => (
                        <span 
                          key={i}
                          className="text-sm text-white glass-card px-3 py-1 rounded-full border border-fleur-border"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default VideoTable

