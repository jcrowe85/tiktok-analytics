import { FiEye, FiHeart, FiMessageCircle, FiShare2, FiTrendingUp, FiZap, FiCalendar, FiVideo, FiActivity } from 'react-icons/fi'
import type { VideoMetrics } from '../types'

interface OverviewProps {
  videos: VideoMetrics[]
}

function Overview({ videos }: OverviewProps) {
  const totalViews = videos.reduce((sum, v) => sum + v.view_count, 0)
  const totalLikes = videos.reduce((sum, v) => sum + v.like_count, 0)
  const totalComments = videos.reduce((sum, v) => sum + v.comment_count, 0)
  const totalShares = videos.reduce((sum, v) => sum + v.share_count, 0)

  // Calculate median engagement rate
  const engagementRates = videos.map(v => v.engagement_rate).sort((a, b) => a - b)
  const medianER = engagementRates[Math.floor(engagementRates.length / 2)] || 0

  // Calculate average 24h velocity
  const velocities = videos
    .filter(v => v.velocity_24h !== undefined && v.velocity_24h > 0)
    .map(v => v.velocity_24h!)
  const avgVelocity = velocities.length > 0
    ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
    : 0

  // Calculate posts per day (last 30 days)
  const now = Date.now()
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
  const recentVideos = videos.filter(v => 
    new Date(v.posted_at_iso).getTime() >= thirtyDaysAgo
  )
  const postsPerDay = recentVideos.length / 30

  const stats = [
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: FiEye,
      color: 'blue',
    },
    {
      label: 'Total Likes',
      value: totalLikes.toLocaleString(),
      icon: FiHeart,
      color: 'red',
    },
    {
      label: 'Total Comments',
      value: totalComments.toLocaleString(),
      icon: FiMessageCircle,
      color: 'green',
    },
    {
      label: 'Total Shares',
      value: totalShares.toLocaleString(),
      icon: FiShare2,
      color: 'purple',
    },
    {
      label: 'Median Engagement',
      value: `${(medianER * 100).toFixed(2)}%`,
      icon: FiTrendingUp,
      color: 'indigo',
    },
    {
      label: 'Avg Velocity (24h)',
      value: avgVelocity > 0 ? `${avgVelocity.toFixed(0)} views/hr` : 'N/A',
      icon: FiZap,
      color: 'yellow',
    },
    {
      label: 'Posts/Day (30d)',
      value: postsPerDay.toFixed(1),
      icon: FiCalendar,
      color: 'pink',
    },
    {
      label: 'Total Videos',
      value: videos.length.toString(),
      icon: FiVideo,
      color: 'gray',
    },
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full flex items-center justify-center glass-card">
          <FiActivity className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Performance Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <div
              key={stat.label}
              className="glass-card p-4 glass-card-hover transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/70">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 text-white">{stat.value}</p>
                </div>
                <IconComponent className="w-6 h-6 text-white/50" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Overview

