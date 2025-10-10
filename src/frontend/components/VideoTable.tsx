import { useState } from 'react'
import { FiVideo, FiX } from 'react-icons/fi'
import type { VideoMetrics } from '../types'

interface VideoTableProps {
  videos: VideoMetrics[]
}

type SortKey = 'posted_at_iso' | 'view_count' | 'engagement_rate' | 'velocity_24h'
type SortDirection = 'asc' | 'desc'

function VideoTable({ videos }: VideoTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('posted_at_iso')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedVideo, setSelectedVideo] = useState<VideoMetrics | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

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

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <span className="text-gray-400">⇅</span>
    }
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
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
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center glass-card">
              <FiVideo className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Videos ({videos.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                  Video
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => handleSort('posted_at_iso')}
                >
                  <div className="flex items-center gap-1">
                    Posted <SortIcon column="posted_at_iso" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white/70 uppercase tracking-wider">
                  Duration
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-bold text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => handleSort('view_count')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Views <SortIcon column="view_count" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white/70 uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white/70 uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white/70 uppercase tracking-wider">
                  Shares
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-bold text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => handleSort('engagement_rate')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Eng. Rate <SortIcon column="engagement_rate" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-bold text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => handleSort('velocity_24h')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Velocity 24h <SortIcon column="velocity_24h" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sortedVideos.map((video) => (
                <tr 
                  key={video.id}
                  className="hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => setSelectedVideo(video)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
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
                          className="w-16 h-16 glass-card rounded flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-white/30 transition-all"
                          title="Open video on TikTok"
                        >
                        {video.cover_image_url ? (
                          <img 
                            src={video.cover_image_url} 
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40">
                            <FiVideo className="w-6 h-6" />
                          </div>
                        )}
                        </a>
                      ) : (
                        <div className="w-16 h-16 glass-card rounded flex-shrink-0 overflow-hidden">
                          {video.cover_image_url ? (
                            <img 
                              src={video.cover_image_url} 
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40">
                              <FiVideo className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate max-w-xs">
                          {truncate(video.caption, 60)}
                        </p>
                        {video.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {video.hashtags.slice(0, 3).map((tag, i) => (
                              <span 
                                key={i}
                                className="text-xs text-white/80 glass-card px-2 py-0.5 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                            {video.hashtags.length > 3 && (
                              <span className="text-xs text-white/50">
                                +{video.hashtags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white/70">
                    {formatDate(video.posted_at_iso)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white/70">
                    {video.duration}s
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-semibold text-right">
                    {video.view_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white/70 text-right">
                    {video.like_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white/70 text-right">
                    {video.comment_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white/70 text-right">
                    {video.share_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white border border-fleur-border">
                      {(video.engagement_rate * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-white text-right">
                    {video.velocity_24h ? (
                      <span className="text-white font-semibold">
                        {video.velocity_24h.toFixed(0)}/hr
                      </span>
                    ) : (
                      <span className="text-white/40">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {videos.length === 0 && (
          <div className="text-center py-12 text-white/50">
            No videos match your filters
          </div>
        )}
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
                  <img 
                    src={selectedVideo.cover_image_url} 
                    alt="Video thumbnail"
                    className="w-full max-w-md mx-auto rounded-lg border border-fleur-border"
                  />
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
                    <p className="text-white font-semibold">{formatDate(selectedVideo.posted_at_iso)}</p>
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

