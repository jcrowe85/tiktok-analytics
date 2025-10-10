import { useState, useEffect } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
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
  })

  useEffect(() => {
    fetchData()
  }, [])

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

    return filtered
  }

  const filteredVideos = applyFilters(videos)

  if (loading) {
    return (
      <div className="min-h-screen bg-fleur-dark relative flex items-center justify-center">
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{ backgroundImage: 'url(/dashboard.png)' }}
        />
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
          <p className="mt-4 text-white/70">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-fleur-dark relative flex items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{ backgroundImage: 'url(/dashboard.png)' }}
        />
        <div className="glass-card p-6 max-w-md relative z-10">
          <h2 className="text-white font-semibold text-lg mb-2">Error Loading Data</h2>
          <p className="text-white/70">{error}</p>
          <p className="text-sm text-white/60 mt-4">
            Make sure you've run <code className="bg-white/10 px-2 py-1 rounded">npm run fetch</code> first.
          </p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 glass-card glass-card-hover rounded-full border border-fleur-border-strong transition-all"
          >
            <span className="font-semibold text-white">Retry</span>
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
    <div className="min-h-screen bg-fleur-dark relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{ backgroundImage: 'url(/dashboard.png)' }}
      />
      
      {/* Content */}
      <div className="relative z-10">
      {/* Header */}
      <header className="glass-card border-0 border-b border-fleur-border rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">TikTok Analytics</h1>
              <p className="text-sm text-white/70 mt-1">
                Your organic video performance in one place
              </p>
            </div>
            <button
              onClick={fetchData}
              className="px-4 py-2 glass-card glass-card-hover rounded-full flex items-center gap-2 transition-all border border-fleur-border-strong"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span className="font-semibold text-white">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview */}
        <Overview videos={filteredVideos} />

        {/* Filters */}
        <Filters filters={filters} setFilters={setFilters} />

        {/* Video Table */}
        <VideoTable videos={filteredVideos} />
      </div>
      </div>
    </div>
  )
}

export default App

