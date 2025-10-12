import { useState, useEffect } from 'react'
import Overview from './components/Overview'
import VideoTable from './components/VideoTable'
import Filters from './components/Filters'
import type { VideoMetrics, Filters as FilterType } from './types'

function App() {
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
  })
  const [showFilters, setShowFilters] = useState(false)

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
      setLoading(true)
      const response = await fetch('/api/data')
      
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()
      setVideos(result.data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (videos: VideoMetrics[]): VideoMetrics[] => {
    let filtered = [...videos]

    // Search text (caption search)
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase()
      filtered = filtered.filter(v => 
        v.caption.toLowerCase().includes(search) ||
        v.hashtags.some(h => h.includes(search))
      )
    }

    // Date range
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start).getTime()
      filtered = filtered.filter(v => new Date(v.posted_at_iso).getTime() >= startDate)
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end).getTime()
      filtered = filtered.filter(v => new Date(v.posted_at_iso).getTime() <= endDate)
    }

    // Duration buckets
    if (filters.durationBucket !== 'all') {
      filtered = filtered.filter(v => {
        if (filters.durationBucket === 'short') return v.duration < 10
        if (filters.durationBucket === 'medium') return v.duration >= 10 && v.duration <= 20
        if (filters.durationBucket === 'long') return v.duration > 20
        return true
      })
    }

    // Hashtag filter
    if (filters.hashtag) {
      const tag = filters.hashtag.toLowerCase().replace('#', '')
      filtered = filtered.filter(v => v.hashtags.some(h => h.includes(tag)))
    }

    // Top movers (largest 24h velocity)
    if (filters.showTopMovers) {
      filtered = filtered
        .filter(v => v.velocity_24h !== undefined && v.velocity_24h > 0)
        .sort((a, b) => (b.velocity_24h || 0) - (a.velocity_24h || 0))
        .slice(0, 20)
    }

    // AI Quality Band filter
    if (filters.aiQualityBand !== 'all') {
      filtered = filtered.filter(v => {
        if (!v.ai_scores) return false
        const score = v.ai_scores.overall_100
        if (filters.aiQualityBand === 'pass') return score >= 80
        if (filters.aiQualityBand === 'revise') return score >= 60 && score < 80
        if (filters.aiQualityBand === 'reshoot') return score < 60
        return true
      })
    }

    return filtered
  }

  const hasActiveFilters = () => {
    return filters.searchText !== '' ||
           filters.dateRange.start !== '' ||
           filters.dateRange.end !== '' ||
           filters.durationBucket !== 'all' ||
           filters.hashtag !== '' ||
           filters.showTopMovers ||
           filters.aiQualityBand !== 'all'
  }

  const filteredVideos = applyFilters(videos)

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
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20"></div>
        </div>
        <div className="modern-card p-8 max-w-md relative z-10 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Error Loading Data</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <p className="text-sm text-white/60 mb-6">
            Make sure you've run <code className="bg-white/10 px-3 py-1 rounded-lg text-blue-300">npm run fetch</code> first.
          </p>
          <button
            onClick={fetchData}
            className="modern-button px-6 py-3 text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen bg-fleur-dark relative flex items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{ backgroundImage: 'url(/dashboard.png)' }}
        />
        <div className="glass-card p-6 max-w-md relative z-10">
          <h2 className="text-white font-semibold text-lg mb-2">No Data Available</h2>
          <p className="text-white/70">
            No videos found. Run the fetch job to pull your TikTok analytics.
          </p>
          <pre className="mt-4 bg-white/5 text-white/80 p-3 rounded text-sm border border-fleur-border">
            npm run fetch
          </pre>
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
      {/* Modern Header */}
      <header className="glass-card border-0 border-b border-white/10 rounded-none">
        <div className="px-4 sm:px-8 lg:px-12 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TikTok Analytics
              </h1>
              <p className="text-xs sm:text-sm text-white/60 font-medium hidden sm:block">
                Advanced video performance insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs sm:text-sm font-medium text-white/80">
                  {filteredVideos.length} videos
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

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

export default App

