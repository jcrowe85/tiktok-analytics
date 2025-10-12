import { useState, useEffect } from 'react'
import VideoTable from '../components/VideoTable'
import { AdHocAnalysis } from '../components/AdHocAnalysis'
import type { VideoMetrics } from '../types'

// Helper to convert ad-hoc analysis to VideoMetrics format
function convertAdHocToVideo(analysis: any): VideoMetrics {
  // Convert findings from the API format to VideoMetrics format
  const convertedFindings = analysis.findings ? {
    hook_strength: analysis.findings.hook_verdict || '',
    depth: analysis.findings.depth_verdict || '',
    clarity: '',
    pacing: '',
    cta: analysis.findings.cta_notes || '',
    brand_fit: '',
  } : undefined;

  // Calculate engagement rate
  const viewCount = analysis.viewCount || 0
  const likeCount = analysis.likeCount || 0
  const commentCount = analysis.commentCount || 0
  const shareCount = analysis.shareCount || 0
  const totalEngagement = likeCount + commentCount + shareCount
  const engagementRate = viewCount > 0 ? (totalEngagement / viewCount) * 100 : 0

  return {
    id: analysis.videoId,
    caption: analysis.staticData?.videoTitle || 'Ad-Hoc Analysis',
    hashtags: [],
    posted_at_iso: analysis.processed_at,
    duration: analysis.duration || 0,
    create_time: Date.now(),
    video_description: '',
    view_count: viewCount,
    like_count: likeCount,
    comment_count: commentCount,
    share_count: shareCount,
    engagement_rate: engagementRate,
    like_rate: viewCount > 0 ? (likeCount / viewCount) * 100 : 0,
    comment_rate: viewCount > 0 ? (commentCount / viewCount) * 100 : 0,
    share_rate: viewCount > 0 ? (shareCount / viewCount) * 100 : 0,
    velocity_24h: 0, // Not available for ad-hoc
    share_url: analysis.url,
    cover_image_url: analysis.coverImageUrl || '',
    ai_scores: analysis.scores,
    ai_visual_scores: analysis.visual_scores,
    ai_findings: convertedFindings,
    ai_fix_suggestions: analysis.fix_suggestions,
    ai_processed_at: analysis.processed_at,
  }
}

function AdHocPage() {
  const [adHocVideos, setAdHocVideos] = useState<VideoMetrics[]>([])
  const [showAdHocAnalysis, setShowAdHocAnalysis] = useState(false)

  // Load ad-hoc analyses from localStorage on mount
  useEffect(() => {
    loadAdHocAnalyses()
  }, [])

  const loadAdHocAnalyses = () => {
    try {
      const stored = localStorage.getItem('adHocAnalyses')
      if (stored) {
        const analyses = JSON.parse(stored)
        const videos = analyses.map(convertAdHocToVideo)
        setAdHocVideos(videos)
      }
    } catch (error) {
      console.error('Failed to load ad-hoc analyses:', error)
    }
  }

  // Removed clearAllAnalyses - users paid for these analyses

  const handleAnalysisComplete = () => {
    // Reload analyses after new one is added
    console.log('🔄 Reloading analyses after completion...')
    loadAdHocAnalyses()
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
            {/* Page Actions */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/60 text-sm">
                  Analyze competitors and external videos
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdHocAnalysis(true)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">➕</span>
                  <span className="text-xs sm:text-sm font-medium text-blue-400">
                    New Analysis
                  </span>
                </button>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-xs sm:text-sm font-medium text-white/80">
                    {adHocVideos.length} {adHocVideos.length === 1 ? 'analysis' : 'analyses'}
                  </span>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {adHocVideos.length === 0 ? (
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
                  Analyze any TikTok video to see insights. Perfect for competitive research and learning from top performers.
                </p>
                <button
                  onClick={() => setShowAdHocAnalysis(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <span>🎯</span>
                  <span>Analyze Your First Video</span>
                </button>

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
            ) : (
              <>
                {/* Info Banner */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div>
                      <h4 className="text-blue-400 font-medium mb-1">About Ad-Hoc Analyses</h4>
                      <p className="text-white/60 text-sm">
                        These analyses are stored locally in your browser. They won't affect your main dashboard stats and will persist until you clear them or your browser cache.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Video Table */}
                <VideoTable 
                  videos={adHocVideos}
                  showFilters={false}
                  setShowFilters={() => {}}
                  hasActiveFilters={() => false}
                />
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Ad-Hoc Analysis Modal */}
      {showAdHocAnalysis && (
        <AdHocAnalysis 
          onClose={() => {
            console.log('🚪 Closing modal...')
            setShowAdHocAnalysis(false)
            // Small delay to ensure localStorage is saved
            setTimeout(() => {
              handleAnalysisComplete()
            }, 100)
          }} 
        />
      )}
    </>
  )
}

export default AdHocPage
