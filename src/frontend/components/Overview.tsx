import { FiEye, FiHeart, FiMessageCircle, FiShare2, FiTrendingUp, FiZap, FiCalendar, FiVideo, FiActivity, FiArrowUp, FiArrowDown, FiClock } from 'react-icons/fi'
import { useState } from 'react'
import type { VideoMetrics } from '../types'

interface OverviewProps {
  videos: VideoMetrics[]
}

type TimePeriod = '24h' | '7d' | '30d'

function Overview({ videos }: OverviewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('24h')

  // Calculate period comparison based on selected time frame
  const calculatePeriodComparison = (getValue: (video: VideoMetrics) => number, period: TimePeriod) => {
    const now = Date.now()
    let periodMs: number
    let periodLabel: string
    
    switch (period) {
      case '24h':
        periodMs = 24 * 60 * 60 * 1000
        periodLabel = 'vs previous 24h'
        break
      case '7d':
        periodMs = 7 * 24 * 60 * 60 * 1000
        periodLabel = 'vs previous 7 days'
        break
      case '30d':
        periodMs = 30 * 24 * 60 * 60 * 1000
        periodLabel = 'vs previous 30 days'
        break
    }
    
    const recentPeriod = now - periodMs
    const previousPeriod = now - (periodMs * 2)
    
    // Videos from recent period
    const recentVideos = videos.filter(v => {
      const videoTime = new Date(v.posted_at_iso).getTime()
      return videoTime >= recentPeriod
    })
    
    // Videos from previous period
    const previousVideos = videos.filter(v => {
      const videoTime = new Date(v.posted_at_iso).getTime()
      return videoTime >= previousPeriod && videoTime < recentPeriod
    })
    
    const recentTotal = recentVideos.reduce((sum, v) => sum + getValue(v), 0)
    const previousTotal = previousVideos.reduce((sum, v) => sum + getValue(v), 0)
    
    // If no previous data, show "New data" indicator
    if (previousTotal === 0) {
      return recentTotal > 0 ? { 
        percentage: 100, 
        isIncrease: true, 
        isNew: true,
        period: periodLabel,
        count: recentVideos.length
      } : null
    }
    
    const percentage = ((recentTotal - previousTotal) / previousTotal) * 100
    return {
      percentage: Math.abs(percentage),
      isIncrease: percentage >= 0,
      isNew: false,
      period: periodLabel,
      count: recentVideos.length
    }
  }

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

  // Calculate period comparisons for each metric based on selected time period
  const viewsComparison = calculatePeriodComparison(v => v.view_count, timePeriod)
  const likesComparison = calculatePeriodComparison(v => v.like_count, timePeriod)
  const commentsComparison = calculatePeriodComparison(v => v.comment_count, timePeriod)
  const sharesComparison = calculatePeriodComparison(v => v.share_count, timePeriod)

  const stats = [
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: FiEye,
      color: 'blue',
      comparison: viewsComparison,
    },
    {
      label: 'Total Likes',
      value: totalLikes.toLocaleString(),
      icon: FiHeart,
      color: 'red',
      comparison: likesComparison,
    },
    {
      label: 'Total Comments',
      value: totalComments.toLocaleString(),
      icon: FiMessageCircle,
      color: 'green',
      comparison: commentsComparison,
    },
    {
      label: 'Total Shares',
      value: totalShares.toLocaleString(),
      icon: FiShare2,
      color: 'purple',
      comparison: sharesComparison,
    },
    {
      label: 'Median Engagement',
      value: `${(medianER * 100).toFixed(2)}%`,
      icon: FiTrendingUp,
      color: 'indigo',
      comparison: null, // Not applicable for median
    },
    {
      label: 'Avg Velocity (24h)',
      value: avgVelocity > 0 ? `${avgVelocity.toFixed(0)} views/hr` : 'N/A',
      icon: FiZap,
      color: 'yellow',
      comparison: null, // Already a 24h metric
    },
    {
      label: 'Posts/Day (30d)',
      value: postsPerDay.toFixed(1),
      icon: FiCalendar,
      color: 'pink',
      comparison: null, // 30-day average
    },
    {
      label: 'Total Videos',
      value: videos.length.toString(),
      icon: FiVideo,
      color: 'gray',
      comparison: null, // Total count
    },
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center glass-card">
            <FiActivity className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Performance Overview</h2>
        </div>
        
        {/* Time Period Selector */}
        <div className="flex items-center gap-2">
          <FiClock className="w-4 h-4 text-white/50" />
          <div className="flex bg-black/20 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            {(['24h', '7d', '30d'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  timePeriod === period
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                {period === '24h' ? '24h' : period === '7d' ? '7d' : '30d'}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <div
              key={stat.label}
              className="glass-card p-4 glass-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/70">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 text-white">{stat.value}</p>
                </div>
                <IconComponent className="w-6 h-6 text-white/50" />
              </div>
              
              {/* 24h Comparison Indicator */}
              {stat.comparison && (
                <div className="flex items-center gap-1 mt-2">
                  {stat.comparison.isNew ? (
                    <FiZap className="w-3 h-3 text-blue-400" />
                  ) : stat.comparison.isIncrease ? (
                    <FiArrowUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <FiArrowDown className="w-3 h-3 text-red-400" />
                  )}
                  <span 
                    className={`text-xs font-medium ${
                      stat.comparison.isNew ? 'text-blue-400' :
                      stat.comparison.isIncrease ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {stat.comparison.isNew ? `New data (${stat.comparison.period})` : 
                     `${stat.comparison.percentage.toFixed(1)}% ${stat.comparison.period}`}
                  </span>
                </div>
              )}
              
              {/* Show "No data" for metrics without comparison */}
              {stat.comparison === null && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-white/40">
                    {stat.label.includes('Engagement') && '30-day median'}
                    {stat.label.includes('Velocity') && 'Real-time metric'}
                    {stat.label.includes('Posts/Day') && '30-day average'}
                    {stat.label.includes('Total Videos') && 'All-time total'}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Overview

