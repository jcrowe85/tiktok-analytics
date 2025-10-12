import { useState, useEffect } from 'react'
import VideoTable from '../components/VideoTable'
import type { VideoMetrics } from '../types'

function AdHocPage() {
  const [adHocVideos, setAdHocVideos] = useState<VideoMetrics[]>([])
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoMetrics | null>(null)

  // Load ad-hoc analyses from database on mount
  useEffect(() => {
    loadAdHocAnalyses()
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedVideo) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedVideo])

  const loadAdHocAnalyses = async (): Promise<VideoMetrics[]> => {
    try {
      // Fetch from database instead of localStorage
      const response = await fetch('/api/adhoc-analyses')
      if (!response.ok) {
        throw new Error('Failed to fetch ad-hoc analyses')
      }
      
      const result = await response.json()
      
      if (result.success && result.data) {
        // Convert database format to VideoMetrics format
        const videos = result.data.map((video: any) => ({
          id: video.id,
          caption: video.video_title || video.caption || 'Ad-Hoc Analysis',
          hashtags: video.hashtags || [],
          posted_at_iso: video.posted_at_iso,
          duration: video.duration || 0,
          create_time: new Date(video.created_at).getTime(),
          video_description: '',
          view_count: video.view_count || 0,
          like_count: video.like_count || 0,
          comment_count: video.comment_count || 0,
          share_count: video.share_count || 0,
          engagement_rate: video.engagement_rate || 0,
          like_rate: video.like_rate || 0,
          comment_rate: video.comment_rate || 0,
          share_rate: video.share_rate || 0,
          velocity_24h: video.velocity_24h || 0,
          share_url: video.share_url || '',
          cover_image_url: video.cover_image_url || '',
          ai_scores: video.scores,
          ai_visual_scores: video.visual_scores,
          ai_findings: video.findings,
          ai_fix_suggestions: video.fix_suggestions,
          ai_processed_at: video.ai_processed_at,
        }))
        
        setAdHocVideos(videos)
        return videos
      }
      return []
    } catch (error) {
      console.error('Failed to load ad-hoc analyses:', error)
      return []
    }
  }

  // Removed clearAllAnalyses - users paid for these analyses

  const handleAnalyze = async () => {
    if (!url.trim()) {
      alert('Please enter a TikTok URL')
      return
    }

    // Validate TikTok URL format
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
      alert('Please enter a valid TikTok URL')
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      // Clear the URL input
      setUrl('')
      
      // Reload analyses and show the newly analyzed video
      setTimeout(async () => {
        const refreshedVideos = await loadAdHocAnalyses()
        
        // Find the most recently created video (newest analysis)
        if (refreshedVideos.length > 0) {
          const sortedByCreation = [...refreshedVideos].sort((a, b) => b.create_time - a.create_time)
          const newestVideo = sortedByCreation[0]
          setSelectedVideo(newestVideo)
        }
      }, 1000) // Small delay to ensure analysis is complete and data is refreshed
      
      console.log('✅ Analysis completed successfully')
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      alert(error instanceof Error ? error.message : 'Failed to analyze video')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <>
      <div className="min-h-screen relative">
        {/* Modern Background Pattern */}
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-indigo-900/20"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`
          }}></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/60 text-sm">
                  Analyze competitors and external videos
                </p>
              </div>
              <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 rounded-xl border border-white/10">
                <span className="text-xs sm:text-sm font-medium text-white/80">
                  {adHocVideos.length} {adHocVideos.length === 1 ? 'analysis' : 'analyses'}
                </span>
              </div>
            </div>

            {/* Empty State */}
            {adHocVideos.length === 0 ? (
              <>
                {/* TikTok URL Input Section */}
                <div className="glass-card rounded-2xl p-6 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        TikTok Video URL
                      </label>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.tiktok.com/@username/video/..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                        disabled={isAnalyzing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isAnalyzing) {
                            handleAnalyze()
                          }
                        }}
                      />
                      <p className="text-white/50 text-xs mt-2">
                        Paste any public TikTok URL to analyze performance and get insights
                      </p>
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !url.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap min-w-[120px] justify-center shadow-lg hover:shadow-purple-500/25"
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <span>Analyze</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-12 text-center">
                {/* Beautiful gradient icon container */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-2xl"></div>
                  <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl p-6 border border-white/10">
                    <svg className="w-12 h-12 text-blue-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Start Analyzing Competitors
                </h3>
                <p className="text-white/60 mb-8 max-w-md mx-auto">
                  Paste any TikTok URL above to analyze video performance and get AI-powered insights. Perfect for competitive research and learning from top performers.
                </p>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-2xl mb-2">🕵️</div>
                    <h4 className="text-white font-semibold mb-1">Competitive Research</h4>
                    <p className="text-white/60 text-sm">Analyze your competitors' top performing videos</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-2xl mb-2">📚</div>
                    <h4 className="text-white font-semibold mb-1">Learn Best Practices</h4>
                    <p className="text-white/60 text-sm">See what makes viral videos successful</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-2xl mb-2">💡</div>
                    <h4 className="text-white font-semibold mb-1">Get Insights</h4>
                    <p className="text-white/60 text-sm">Actionable feedback on any public TikTok</p>
                  </div>
                </div>
                </div>
              </>
            ) : (
              <>
                {/* TikTok URL Input Section */}
                <div className="glass-card rounded-2xl p-6 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        TikTok Video URL
                      </label>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.tiktok.com/@username/video/..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                        disabled={isAnalyzing}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isAnalyzing) {
                            handleAnalyze()
                          }
                        }}
                      />
                      <p className="text-white/50 text-xs mt-2">
                        Paste any public TikTok URL to analyze performance and get insights
                      </p>
                    </div>
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !url.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap min-w-[120px] justify-center shadow-lg hover:shadow-purple-500/25"
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <span>Analyze</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Video Table */}
                <VideoTable 
                  videos={adHocVideos}
                  showFilters={false}
                  setShowFilters={() => {}}
                  hasActiveFilters={() => false}
                  selectedVideo={selectedVideo}
                  setSelectedVideo={setSelectedVideo}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AdHocPage
