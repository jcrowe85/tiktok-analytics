import { FiEye, FiHeart, FiMessageCircle, FiShare2, FiTrendingUp, FiZap, FiCalendar, FiVideo, FiActivity, FiArrowUp, FiArrowDown, FiClock } from 'react-icons/fi'
import { useState } from 'react'
import type { VideoMetrics } from '../types'

interface OverviewProps {
  videos: VideoMetrics[]
}

type TimePeriod = '24h' | '7d' | '30d' | 'custom'

interface CustomDateRange {
  period1: {
    start: string
    end: string
  }
  period2: {
    start: string
    end: string
  }
}

function Overview({ videos }: OverviewProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('24h')
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    period1: { start: '', end: '' },
    period2: { start: '', end: '' }
  })
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  // Helper functions for custom date picker
  const handlePeriod1Change = (start: string, end: string) => {
    setCustomDateRange(prev => ({
      ...prev,
      period1: { start, end }
    }))
    setTimePeriod('custom')
  }

  const handlePeriod2Change = (start: string, end: string) => {
    setCustomDateRange(prev => ({
      ...prev,
      period2: { start, end }
    }))
    setTimePeriod('custom')
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getDefaultDateRange = () => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000))
    return {
      period1: {
        start: formatDateForInput(thirtyDaysAgo),
        end: formatDateForInput(now)
      },
      period2: {
        start: formatDateForInput(sixtyDaysAgo),
        end: formatDateForInput(thirtyDaysAgo)
      }
    }
  }

  // Calculate period comparison based on selected time frame
  const calculatePeriodComparison = (getValue: (video: VideoMetrics) => number, period: TimePeriod) => {
    const now = Date.now()
    let recentStart: number
    let recentEnd: number
    let previousStart: number
    let previousEnd: number
    let periodLabel: string
    
    if (period === 'custom' && customDateRange.period1.start && customDateRange.period1.end && customDateRange.period2.start && customDateRange.period2.end) {
      // Custom dual period comparison
      const period1Start = new Date(customDateRange.period1.start).getTime()
      const period1End = new Date(customDateRange.period1.end).getTime()
      const period2Start = new Date(customDateRange.period2.start).getTime()
      const period2End = new Date(customDateRange.period2.end).getTime()
      
      recentStart = period1Start
      recentEnd = period1End
      previousStart = period2Start
      previousEnd = period2End
      periodLabel = 'vs selected period'
    } else {
      // Standard time periods
      let periodMs: number
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
        default:
          return null
      }
      
      recentStart = now - periodMs
      recentEnd = now
      previousStart = now - (periodMs * 2)
      previousEnd = now - periodMs
    }
    
    // Videos from recent period
    const recentVideos = videos.filter(v => {
      const videoTime = new Date(v.posted_at_iso).getTime()
      return videoTime >= recentStart && videoTime <= recentEnd
    })
    
    // Videos from previous period
    const previousVideos = videos.filter(v => {
      const videoTime = new Date(v.posted_at_iso).getTime()
      return videoTime >= previousStart && videoTime < previousEnd
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
                onClick={() => {
                  setTimePeriod(period)
                  setShowCustomPicker(false)
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  timePeriod === period
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                }`}
              >
                {period === '24h' ? '24h' : period === '7d' ? '7d' : '30d'}
              </button>
            ))}
            
            {/* Custom Date Range Button */}
            <button
              onClick={() => {
                setShowCustomPicker(!showCustomPicker)
                if (!showCustomPicker && (!customDateRange.period1.start || !customDateRange.period2.start)) {
                  const defaultRange = getDefaultDateRange()
                  setCustomDateRange(defaultRange)
                }
              }}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                timePeriod === 'custom'
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/10'
              }`}
              title="Custom date range"
            >
              <FiCalendar className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Custom Date Range Picker Container */}
      {showCustomPicker && (
        <div className="mb-6 glass-card p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-white/70" />
              <h3 className="text-lg font-semibold text-white">Custom Period Comparison</h3>
            </div>
            <button
              onClick={() => {
                setShowCustomPicker(false)
                setTimePeriod('24h')
              }}
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Dual Calendar Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Period 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h4 className="text-sm font-medium text-white">Period 1</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-col">
                  <label className="text-xs text-white/50 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.period1.start}
                    onChange={(e) => handlePeriod1Change(e.target.value, customDateRange.period1.end)}
                    className="px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-xs text-white/50 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.period1.end}
                    onChange={(e) => handlePeriod1Change(customDateRange.period1.start, e.target.value)}
                    className="px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              
              {customDateRange.period1.start && customDateRange.period1.end && (
                <div className="p-2 bg-blue-500/10 rounded text-xs text-blue-300">
                  {new Date(customDateRange.period1.start).toLocaleDateString()} - {new Date(customDateRange.period1.end).toLocaleDateString()}
                </div>
              )}
            </div>
            
            {/* Period 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <h4 className="text-sm font-medium text-white">Period 2</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-col">
                  <label className="text-xs text-white/50 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.period2.start}
                    onChange={(e) => handlePeriod2Change(e.target.value, customDateRange.period2.end)}
                    className="px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-xs text-white/50 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.period2.end}
                    onChange={(e) => handlePeriod2Change(customDateRange.period2.start, e.target.value)}
                    className="px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                </div>
              </div>
              
              {customDateRange.period2.start && customDateRange.period2.end && (
                <div className="p-2 bg-orange-500/10 rounded text-xs text-orange-300">
                  {new Date(customDateRange.period2.start).toLocaleDateString()} - {new Date(customDateRange.period2.end).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          {/* Comparison Info */}
          {timePeriod === 'custom' && customDateRange.period1.start && customDateRange.period1.end && customDateRange.period2.start && customDateRange.period2.end && (
            <div className="mt-6 p-4 bg-black/10 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <FiTrendingUp className="w-4 h-4 text-white/60" />
                <span className="text-sm font-medium text-white/80">Comparison Active</span>
              </div>
              <p className="text-xs text-white/60">
                Period 1 vs Period 2 comparison is now active. Metrics will show percentage changes between these two selected periods.
              </p>
            </div>
          )}
        </div>
      )}
      
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


