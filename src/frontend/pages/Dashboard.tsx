import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Overview from '../components/Overview'
import VideoTable from '../components/VideoTable'
import Filters from '../components/Filters'
import type { VideoMetrics, Filters as FilterType } from '../types'

function Dashboard() {
  const navigate = useNavigate()
  const [videos, setVideos] = useState<VideoMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterType>({
    searchText: '',
    dateRange: { start: '', end: '' },
    durationBucket: 'all',
    hashtag: '',
    showTopMovers: false,
    aiQualityBand: 'all',
    contentType: 'all',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Helper function to detect carousel content
  const isCarousel = (caption: string): boolean => {
    const lowerCaption = caption.toLowerCase()
    return lowerCaption.includes('swipe') || 
           lowerCaption.includes('carousel') || 
           lowerCaption.includes('multiple') || 
           lowerCaption.includes('part 1') || 
           lowerCaption.includes('part 2') || 
           lowerCaption.includes('1/') || 
           lowerCaption.includes('2/')
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Separate effect for auto-refresh polling
  useEffect(() => {
    // Only poll if there are videos being analyzed
    const hasUnanalyzedVideos = videos.some(v => !v.ai_scores)
    
    if (!hasUnanalyzedVideos) {
      return // Don't set up polling if all videos are analyzed
    }
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [videos.length]) // Only re-run if number of videos changes

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const result = await response.json()
      // Handle both old array format and new {success, data} format
      const data = result.data || result
      // Ensure data is an array
      setVideos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setVideos([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Apply all filters
  const filteredVideos = (videos || []).filter((video) => {
    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      const matchesCaption = video.caption?.toLowerCase().includes(searchLower)
      const matchesHashtags = video.hashtags?.some(tag => 
        tag.toLowerCase().includes(searchLower)
      )
      if (!matchesCaption && !matchesHashtags) return false
    }

    // Date range filter
    if (filters.dateRange.start && video.posted_at_iso < filters.dateRange.start) {
      return false
    }
    if (filters.dateRange.end && video.posted_at_iso > filters.dateRange.end) {
      return false
    }

    // Duration bucket filter
    if (filters.durationBucket !== 'all') {
      const duration = video.duration
      if (filters.durationBucket === 'short' && duration >= 10) return false
      if (filters.durationBucket === 'medium' && (duration < 10 || duration > 20)) return false
      if (filters.durationBucket === 'long' && duration <= 20) return false
    }

    // Hashtag filter
    if (filters.hashtag) {
      const hasHashtag = video.hashtags?.some(tag => 
        tag.toLowerCase() === filters.hashtag.toLowerCase()
      )
      if (!hasHashtag) return false
    }

    // Top movers filter
    if (filters.showTopMovers) {
      if (!video.velocity_24h || video.velocity_24h <= 0) return false
    }

    // AI quality band filter
    if (filters.aiQualityBand !== 'all' && video.ai_scores) {
      const score = video.ai_scores.overall_100
      if (filters.aiQualityBand === 'pass' && score < 80) return false
      if (filters.aiQualityBand === 'revise' && (score < 60 || score >= 80)) return false
      if (filters.aiQualityBand === 'reshoot' && score >= 60) return false
    }

    // Content type filter
    if (filters.contentType !== 'all') {
      const isStatic = video.duration === 0 || !video.duration
      const isCarouselContent = isCarousel(video.caption)
      
      if (filters.contentType === 'video' && (isStatic || isCarouselContent)) return false
      if (filters.contentType === 'static' && (!isStatic || isCarouselContent)) return false
      if (filters.contentType === 'carousel' && !isCarouselContent) return false
    }

    return true
  })

  const hasActiveFilters = () => {
    return (
      filters.searchText !== '' ||
      filters.dateRange.start !== '' ||
      filters.dateRange.end !== '' ||
      filters.durationBucket !== 'all' ||
      filters.hashtag !== '' ||
      filters.showTopMovers ||
      filters.aiQualityBand !== 'all' ||
      filters.contentType !== 'all'
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20"></div>
        </div>
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-white/10 rounded-full animate-spin border-t-blue-500"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-pulse border-t-purple-500"></div>
          </div>
          <p className="mt-6 text-white/80 font-medium text-lg text-center">Loading analytics...</p>
          <p className="mt-2 text-white/50 text-sm text-center">Preparing your dashboard</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6">
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20"></div>
        </div>
        <div className="relative z-10 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Data</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Modern Background Pattern */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
        }}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          {/* Overview */}
          <div className="animate-fade-in-up">
            <Overview videos={filteredVideos} />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Filters filters={filters} setFilters={setFilters} setShowFilters={setShowFilters} />
            </div>
          )}

          {/* Video Table */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <VideoTable 
              videos={filteredVideos} 
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

