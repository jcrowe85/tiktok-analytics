import React, { useState, useEffect } from 'react';
import VideoTable from '../components/VideoTable';
import { TikTokConnection } from '../components/TikTokConnection';
import { FiRefreshCw, FiAlertCircle, FiAward, FiZap, FiX } from 'react-icons/fi';

interface MyVideosData {
  videos: any[];
  totalVideos: number;
  videosAllowed: number;
  remainingVideos: number;
  planType: string;
  connected: boolean;
  username?: string;
  displayName?: string;
}

export const MyVideos: React.FC = () => {
  const [data, setData] = useState<MyVideosData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiktokConnected, setTiktokConnected] = useState(false);

  const fetchMyVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/my-videos', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
        setTiktokConnected(data.connected);
      } else if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.connected === false) {
          setData(null);
          setTiktokConnected(false);
        } else {
          throw new Error(errorData.error || 'Failed to fetch videos');
        }
      } else {
        throw new Error('Failed to fetch videos');
      }
    } catch (err) {
      console.error('Error fetching my videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/my-videos/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh videos after analysis starts
        await fetchMyVideos();
        // Show success message
        alert(`Started analysis for ${result.analyzedCount} videos!`);
      } else if (response.status === 402) {
        const errorData = await response.json();
        // Show upgrade prompt
        alert(`Upgrade required! ${errorData.message}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start analysis');
      }
    } catch (err) {
      console.error('Error starting analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (tiktokConnected) {
      fetchMyVideos();
    }
  }, [tiktokConnected]);

  const handleVideoUpdate = () => {
    fetchMyVideos();
  };

  const renderUpgradePrompt = () => {
    if (!data || data.planType !== 'free') return null;

    const upgradeVideos = data.totalVideos - data.videosAllowed;
    if (upgradeVideos <= 0) return null;

    return (
      <div className="glass-card p-4 border border-yellow-500/20 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
              <FiAward className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">Upgrade to Analyze More Videos</p>
              <p className="text-white/60 text-sm">
                You have {upgradeVideos} more videos that can be analyzed with a premium plan
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:shadow-lg hover:shadow-yellow-500/25 transition-all">
            <FiAward className="w-4 h-4" />
            Upgrade Now
          </button>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (!data) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white/70">Total Videos</p>
            <FiZap className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-2xl font-bold text-white">{data.totalVideos}</p>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white/70">Videos Analyzed</p>
            <FiZap className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-2xl font-bold text-white">{data.videosAllowed}</p>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white/70">Plan Type</p>
            <FiAward className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-2xl font-bold text-white capitalize">{data.planType}</p>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-white/70">Remaining</p>
            <FiAlertCircle className="w-4 h-4 text-white/50" />
          </div>
          <p className="text-2xl font-bold text-white">{data.remainingVideos}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Videos</h1>
          <p className="text-white/70">
            {data?.connected ? (
              `Connected as @${data.username} • Analyze your TikTok videos with AI insights`
            ) : (
              'Connect your TikTok account to analyze your videos'
            )}
          </p>
        </div>

        {/* TikTok Connection Status */}
        <TikTokConnection onConnectionChange={setTiktokConnected} />

        {!tiktokConnected && (
          <div className="glass-card p-8 text-center mt-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connect Your TikTok Account</h3>
            <p className="text-white/70 mb-6">
              Connect your TikTok account to start analyzing your videos with AI insights. 
              Get detailed analytics, engagement scores, and optimization suggestions.
            </p>
          </div>
        )}

        {tiktokConnected && (
          <>
            {/* Stats */}
            {renderStats()}

            {/* Upgrade Prompt */}
            {renderUpgradePrompt()}

            {/* Error Display */}
            {error && (
              <div className="glass-card p-4 border border-red-500/20 mb-6">
                <div className="flex items-center gap-3">
                  <FiAlertCircle className="w-5 h-5 text-red-400" />
                  <div className="flex-1">
                    <p className="text-red-400 font-medium">Error</p>
                    <p className="text-red-300/70 text-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={fetchMyVideos}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {data && data.videosAllowed > 0 && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  {analyzing ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiZap className="w-4 h-4" />
                  )}
                  {analyzing ? 'Starting Analysis...' : 'Start Analysis'}
                </button>
              )}
            </div>

            {/* Videos Table */}
            {loading ? (
              <div className="glass-card p-8 text-center">
                <FiRefreshCw className="w-8 h-8 text-white/50 animate-spin mx-auto mb-4" />
                <p className="text-white/70">Loading your videos...</p>
              </div>
            ) : data && data.videos.length > 0 ? (
              <VideoTable
                videos={data.videos}
                onVideoUpdate={handleVideoUpdate}
                title="Your TikTok Videos"
              />
            ) : (
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">T</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Videos Found</h3>
                <p className="text-white/70">
                  No videos were found in your TikTok account. Make sure you have uploaded videos to analyze.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
