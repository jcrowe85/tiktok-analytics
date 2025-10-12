import React, { useState } from 'react';

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
      
      // Save to localStorage for the Ad-Hoc page
      try {
        const stored = localStorage.getItem('adHocAnalyses') || '[]';
        const analyses = JSON.parse(stored);
        
        // Add new analysis to the beginning of the array
        analyses.unshift(data);
        
        // Keep only the last 50 analyses to avoid storage issues
        const limitedAnalyses = analyses.slice(0, 50);
        
        localStorage.setItem('adHocAnalyses', JSON.stringify(limitedAnalyses));
      } catch (storageError) {
        console.warn('Failed to save to localStorage:', storageError);
        // Don't show error to user, just log it
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };

  const getQualityBadge = (score: number) => {
    if (score >= 80) {
      return { text: '✅ Pass', class: 'bg-green-500/20 text-green-400 border-green-500/30' };
    } else if (score >= 60) {
      return { text: '⚠️ Revise', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    } else {
      return { text: '❌ Reshoot', class: 'bg-red-500/20 text-red-400 border-red-500/30' };
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
          {/* URL Input */}
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

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Overall Score</h3>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold border ${getQualityBadge(result.scores.overall_100).class}`}>
                    {getQualityBadge(result.scores.overall_100).text}
                  </div>
                </div>
                <div className="text-6xl font-bold text-white mb-2">
                  {result.scores.overall_100}
                  <span className="text-2xl text-white/40">/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      result.scores.overall_100 >= 80 ? 'bg-green-500' :
                      result.scores.overall_100 >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${result.scores.overall_100}%` }}
                  />
                </div>
              </div>

              {/* Content Scores */}
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">📊 Content Scores</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries({
                    'Hook Strength': result.scores.hook_strength,
                    'Depth': result.scores.depth,
                    'Clarity': result.scores.clarity,
                    'Pacing': result.scores.pacing,
                    'CTA': result.scores.cta,
                    'Brand Fit': result.scores.brand_fit,
                  }).map(([label, score]) => (
                    <div key={label} className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-white/60 text-xs mb-1">{label}</div>
                      <div className="text-2xl font-bold text-white">
                        {score}<span className="text-sm text-white/40">/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Findings */}
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">💡 Key Findings</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-white/60 text-sm">Hook Verdict:</span>
                    <p className="text-white">{result.findings.hook_verdict}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">Depth Verdict:</span>
                    <p className="text-white">{result.findings.depth_verdict}</p>
                  </div>
                  <div>
                    <span className="text-white/60 text-sm">CTA Notes:</span>
                    <p className="text-white">{result.findings.cta_notes}</p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {result.fix_suggestions && result.fix_suggestions.length > 0 && (
                <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-4">🔧 Suggestions</h3>
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

