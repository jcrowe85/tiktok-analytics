import { useState } from 'react';

interface AdHocAnalysisProps {
  onClose: () => void;
}

export function AdHocAnalysis({ onClose }: AdHocAnalysisProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a TikTok URL');
      return;
    }

    // Validate TikTok URL format
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
      setError('Please enter a valid TikTok URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data);
      console.log('✅ Analysis saved to database')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">🔍 Ad-Hoc Analysis</h2>
            <p className="text-white/60 text-sm mt-1">
              Analyze any TikTok video - yours or competitors
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* URL Input - only show if no results yet */}
          {!result && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                TikTok Video URL
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://www.tiktok.com/@username/video/1234567890..."
                  className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  disabled={loading}
                />
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !url.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-white/30 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      🎯 Analyze
                    </>
                  )}
                </button>
              </div>
              <p className="text-white/40 text-xs mt-2">
                💡 Works with any public TikTok video URL (mobile or desktop)
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">❌ {error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
              <div className="w-12 h-12 border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-400 font-medium">Analyzing video...</p>
              <p className="text-white/40 text-sm mt-2">
                This may take 30-60 seconds depending on video length
              </p>
            </div>
          )}

          {/* Results - Using Video Details Modal Layout */}
          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Video Thumbnail & Performance */}
              <div className="lg:col-span-1 space-y-4">
                {/* Video Thumbnail with Caption & Hashtags */}
                {result.coverImageUrl && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                    <div className="w-full h-[300px] relative">
                      <img 
                        src={result.coverImageUrl} 
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Views Badge - Top Left */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-white backdrop-blur-md shadow-lg">
                          <span>👁</span>
                          {result.viewCount >= 1000000 
                            ? `${(result.viewCount / 1000000).toFixed(1)}M`
                            : result.viewCount >= 1000 
                            ? `${(result.viewCount / 1000).toFixed(1)}K`
                            : result.viewCount.toLocaleString()}
                        </span>
                      </div>

                      {/* Duration Badge - Bottom Right */}
                      <div className="absolute bottom-2.5 right-2.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-white backdrop-blur-md shadow-lg">
                          {result.duration}s
                        </span>
                      </div>
                    </div>
                    
                    {/* Caption & Hashtags */}
                    <div className="p-4 space-y-3">
                      {/* Caption */}
                      <p className="text-sm text-white/90 leading-relaxed line-clamp-3">
                        {result.staticData?.videoTitle || 'Ad-Hoc Analysis'}
                      </p>

                      {/* Author */}
                      {result.staticData?.authorName && (
                        <p className="text-xs text-white/60">
                          by @{result.staticData.authorName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Performance & Details */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white/70 mb-4">Performance & Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Views</span>
                      <span className="text-white font-bold">
                        {result.viewCount >= 1000000 
                          ? `${(result.viewCount / 1000000).toFixed(1)}M`
                          : result.viewCount >= 1000 
                          ? `${(result.viewCount / 1000).toFixed(1)}K`
                          : result.viewCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Likes</span>
                      <span className="text-white font-bold">
                        {result.likeCount >= 1000000 
                          ? `${(result.likeCount / 1000000).toFixed(1)}M`
                          : result.likeCount >= 1000 
                          ? `${(result.likeCount / 1000).toFixed(1)}K`
                          : result.likeCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Comments</span>
                      <span className="text-white font-bold">
                        {result.commentCount >= 1000000 
                          ? `${(result.commentCount / 1000000).toFixed(1)}M`
                          : result.commentCount >= 1000 
                          ? `${(result.commentCount / 1000).toFixed(1)}K`
                          : result.commentCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Shares</span>
                      <span className="text-white font-bold">
                        {result.shareCount >= 1000000 
                          ? `${(result.shareCount / 1000000).toFixed(1)}M`
                          : result.shareCount >= 1000 
                          ? `${(result.shareCount / 1000).toFixed(1)}K`
                          : result.shareCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - AI Analysis */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Analysis Section */}
                <div className="space-y-6">
                  {/* Overall Score Card with Content Scores */}
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Overall Score</h3>
                      <div className={`px-4 py-2 rounded-full text-sm font-bold border ${
                        result.scores.overall_100 >= 80 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        result.scores.overall_100 >= 60 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {result.scores.overall_100 >= 80 ? '✅ Pass' :
                         result.scores.overall_100 >= 60 ? '⚠️ Revise' :
                         '❌ Reshoot'}
                      </div>
                    </div>
                    <div className="text-6xl font-bold text-white mb-4">
                      {result.scores.overall_100}
                      <span className="text-2xl text-white/40">/100</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden mb-6">
                      <div
                        className={`h-full transition-all ${
                          result.scores.overall_100 >= 80 ? 'bg-green-500' :
                          result.scores.overall_100 >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${result.scores.overall_100}%` }}
                      />
                    </div>

                    {/* Content Scores - Inline in same card */}
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-sm font-bold text-white/80 mb-3">Content Breakdown</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries({
                          'Hook': result.scores.hook_strength,
                          'Depth': result.scores.depth,
                          'Clarity': result.scores.clarity,
                          'Pacing': result.scores.pacing,
                          'CTA': result.scores.cta,
                          'Brand Fit': result.scores.brand_fit,
                        }).map(([label, score]) => (
                          <div key={label} className="bg-slate-900/50 rounded-lg p-2.5">
                            <div className="text-white/60 text-xs md:text-sm mb-0.5">{label}</div>
                            <div className="text-xl md:text-2xl font-bold text-white">
                              {score}<span className="text-xs md:text-sm text-white/40">/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Key Findings */}
                  {result.findings && (Object.values(result.findings).some((v: any) => v && v.trim())) && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Key Findings</h3>
                      <div className="space-y-3">
                        {result.findings.hook_strength && (
                          <div>
                            <span className="text-white/60 text-sm font-medium">Hook Analysis:</span>
                            <p className="text-white/90 mt-1">{result.findings.hook_strength}</p>
                          </div>
                        )}
                        {result.findings.depth && (
                          <div>
                            <span className="text-white/60 text-sm font-medium">Depth Analysis:</span>
                            <p className="text-white/90 mt-1">{result.findings.depth}</p>
                          </div>
                        )}
                        {result.findings.cta && (
                          <div>
                            <span className="text-white/60 text-sm font-medium">CTA Analysis:</span>
                            <p className="text-white/90 mt-1">{result.findings.cta}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {result.fix_suggestions && result.fix_suggestions.length > 0 && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Suggestions</h3>
                      <ul className="space-y-2">
                        {result.fix_suggestions.map((suggestion: string, idx: number) => (
                          <li key={idx} className="text-white/80 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">→</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Visual Scores with Progress Bars - Moved to Bottom */}
                  {result.visual_scores && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-white mb-4">Visual Analysis</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries({
                          'Thumbstop': result.visual_scores.thumbstop_prob,
                          'First Frame': result.visual_scores.first_frame_strength,
                          'Silent Comp.': result.visual_scores.silent_comprehension,
                          'Aesthetics': result.visual_scores.visual_aesthetics,
                          'Composition': result.visual_scores.composition,
                          'Motion': result.visual_scores.motion_dynamics,
                          'Pattern Int.': result.visual_scores.pattern_interrupt,
                          'Text Legibility': result.visual_scores.text_legibility,
                          'Emotion': result.visual_scores.emotion_score,
                          'Save Trigger': result.visual_scores.save_share_trigger,
                          'Loopability': result.visual_scores.loopability,
                          'Trend Align': result.visual_scores.trend_alignment,
                        }).map(([label, score]) => (
                          <div key={label} className="bg-slate-900/50 rounded-lg p-3">
                            <div className="text-white/60 text-xs md:text-sm mb-1">{label}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    score >= 8 ? 'bg-green-500' :
                                    score >= 6 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${score * 10}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-white tabular-nums min-w-[28px]">
                                {score.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Done Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      ✅ Done - View in List
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!result && !loading && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-medium mb-2">ℹ️ How it works:</h4>
              <ul className="text-white/60 text-sm space-y-1">
                <li>• Enter any public TikTok video URL</li>
                <li>• Our AI analyzes hook, pacing, CTA, and more</li>
                <li>• Get actionable insights to improve your content</li>
                <li>• Compare against competitors to learn best practices</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

