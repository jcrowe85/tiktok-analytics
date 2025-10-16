import React, { useState, useEffect } from 'react';
import VideoTable from '../components/VideoTable';
import Overview from '../components/Overview';
import { TikTokConnection } from '../components/TikTokConnection';
import { FiRefreshCw, FiAlertCircle, FiX } from 'react-icons/fi';
import type { VideoMetrics } from '../types';

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

// Helper function to convert API video data to VideoMetrics format
const convertToVideoMetrics = (video: any): VideoMetrics => ({
  id: video.id,
  caption: video.video_description || '',
  hashtags: video.hashtags || [],
  posted_at_iso: video.posted_at_iso || video.created_at,
  duration: video.duration || 0,
  create_time: video.create_time || new Date(video.created_at).getTime() / 1000,
  video_description: video.video_description || '',
  view_count: video.view_count || 0,
  like_count: video.like_count || 0,
  comment_count: video.comment_count || 0,
  share_count: video.share_count || 0,
  engagement_rate: video.view_count > 0 
    ? ((video.like_count || 0) + (video.comment_count || 0) + (video.share_count || 0)) / video.view_count 
    : 0,
  like_rate: video.view_count > 0 ? video.like_count / video.view_count : 0,
  comment_rate: video.view_count > 0 ? video.comment_count / video.view_count : 0,
  share_rate: video.view_count > 0 ? video.share_count / video.view_count : 0,
  velocity_24h: 0, // Not available for legacy videos
  share_url: video.share_url || '',
  cover_image_url: video.cover_image_url || '',
  ai_scores: video.ai_scores,
  ai_visual_scores: video.ai_visual_scores,
  ai_findings: video.ai_findings,
  ai_fix_suggestions: video.ai_fix_suggestions || [],
  ai_processed_at: video.ai_processed_at,
  is_adhoc: false,
});


export const MyVideos: React.FC = () => {
  const [data, setData] = useState<MyVideosData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [analyzingVideoIds, setAnalyzingVideoIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const fetchMyVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
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
        
        // Clean up analyzingVideoIds - remove any that are not actually processing
        if (data.videos) {
          setAnalyzingVideoIds(prev => {
            console.log('🔍 Cleaning analyzingVideoIds. Before:', Array.from(prev));
            const newSet = new Set<string>();
            prev.forEach(id => {
              const video = data.videos.find((v: any) => v.id === id);
              console.log(`🔍 Video ${id}: ai_status = ${video?.ai_status}`);
              // Keep only if status is 'processing' (actively analyzing)
              if (video && video.ai_status === 'processing') {
                newSet.add(id);
              }
            });
            console.log('🔍 After cleanup:', Array.from(newSet));
            return newSet;
          });
        }
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

  const pollForCompletion = async (videoId: string) => {
    const maxAttempts = 120; // 10 minutes (5 seconds * 120)
    let attempts = 0;

    const checkStatus = async (): Promise<boolean> => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return true;

        const response = await fetch('/api/my-videos', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          const video = result.videos?.find((v: any) => v.id === videoId);
          
          if (video?.ai_processed_at || video?.ai_status === 'completed' || video?.ai_status === 'failed') {
            // Analysis complete - silently update only the changed data
            setData(prevData => {
              if (!prevData) return result;
              return {
                ...prevData,
                videos: prevData.videos.map(v => 
                  v.id === videoId ? { ...v, ...video } : v
                )
              };
            });
            setAnalyzingVideoIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(videoId);
              return newSet;
            });
            console.log(`✅ Analysis completed for video ${videoId}`);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Polling error:', error);
        return false;
      }
    };

    const poll = async () => {
      attempts++;
      const shouldStop = await checkStatus();
      
      if (shouldStop || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          setAnalyzingVideoIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(videoId);
            return newSet;
          });
        }
        return;
      }
      
      setTimeout(poll, 5000);
    };

    setTimeout(poll, 5000);
  };

  const handleAnalyzeSelected = async () => {
    if (selectedVideos.size === 0) {
      alert('Please select at least one video to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const videoIds = Array.from(selectedVideos);
      const response = await fetch('/api/my-videos/analyze-bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoIds }),
      });

      if (response.ok) {
        await response.json();
        
        // Add all videos to analyzing state
        setAnalyzingVideoIds(prev => new Set([...prev, ...videoIds]));
        
        // Clear selection and exit select mode
        setSelectedVideos(new Set());
        
        // Start polling for each video
        videoIds.forEach(id => pollForCompletion(id));
        
        console.log(`✅ Started analysis for ${videoIds.length} video(s)`);
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

  const handleAnalyzeVideo = async (videoId: string) => {
    try {
      setAnalyzingVideoIds(prev => new Set([...prev, videoId]));
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/my-videos/analyze-single', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      if (response.ok) {
        // Video queued successfully - start background polling for this specific video
        console.log(`✅ Video ${videoId} queued for analysis`);
        pollForCompletion(videoId);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start analysis');
      }
    } catch (err) {
      console.error('Error starting analysis:', err);
      alert(err instanceof Error ? err.message : 'Failed to start analysis');
      // Remove from analyzing state on error
      setAnalyzingVideoIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

  const handleToggleVideo = (videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (!data?.videos) return;
    
    const unanalyzedVideos = data.videos.filter(v => !v.ai_processed_at);
    if (selectedVideos.size === unanalyzedVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(unanalyzedVideos.map(v => v.id)));
    }
  };

  // Fetch videos on mount
  useEffect(() => {
    fetchMyVideos();
  }, []);

  useEffect(() => {
    if (tiktokConnected) {
      fetchMyVideos();
    }
  }, [tiktokConnected]);

  const handleVideoUpdate = () => {
    fetchMyVideos();
  };



  return (
    <>
      <div className="min-h-screen relative">
        {/* Exciting Background with Blue/Purple Gradient */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-purple-950"></div>
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.4) 0%, transparent 35%),
                             radial-gradient(circle at 90% 80%, rgba(147, 51, 234, 0.4) 0%, transparent 35%),
                             radial-gradient(circle at 30% 90%, rgba(14, 165, 233, 0.2) 0%, transparent 30%)`
          }}></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">My Videos</h1>
                <p className="text-white/60 text-sm">
                  {data?.connected ? (
                    `Connected as @${data.username} • Get AI insights`
                  ) : (
                    'Connect your TikTok account to analyze your videos'
                  )}
                </p>
              </div>
              {data && (
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-xs sm:text-sm font-medium text-white/80">
                    {data.videos.length} {data.videos.length === 1 ? 'video' : 'videos'}
                  </span>
                </div>
              )}
            </div>

            {/* Performance Overview */}
            {(tiktokConnected || (data && data.connected)) && data && data.videos && data.videos.length > 0 && (
              <Overview videos={data.videos.map(convertToVideoMetrics)} />
            )}

            {/* Main Content Logic */}
            {loading ? (
              <div className="glass-card p-8 text-center">
                <FiRefreshCw className="w-8 h-8 text-white/50 animate-spin mx-auto mb-4" />
                <p className="text-white/70">Loading your videos...</p>
              </div>
            ) : !(tiktokConnected || (data && data.connected)) ? (
              /* Show Connect Account prompt when not connected */
              <div className="glass-card p-8 text-center mt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">T</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Connect Your TikTok Account</h3>
                <p className="text-white/70 mb-6">
                  Connect your TikTok account to start analyzing your videos with AI insights. 
                  Get detailed analytics, engagement scores, and optimization suggestions.
                </p>
                <TikTokConnection onConnectionChange={setTiktokConnected} />
              </div>
            ) : (
              /* Show connected content - videos or no videos found */
              <>
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


                {/* Videos Table or No Videos Found */}
                {data && data.videos && data.videos.length > 0 ? (
                <VideoTable
                  videos={data.videos.map(convertToVideoMetrics)}
                  onVideoUpdate={handleVideoUpdate}
                  title="Your TikTok Videos"
                  selectedVideos={selectedVideos}
                  onToggleVideo={handleToggleVideo}
                  onAnalyzeVideo={handleAnalyzeVideo}
                  analyzingVideoIds={analyzingVideoIds}
                  selectMode={selectMode}
                  setSelectMode={setSelectMode}
                  onToggleAll={handleToggleAll}
                  onAnalyzeSelected={handleAnalyzeSelected}
                  analyzing={analyzing}
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
      </div>
    </>
  );
};
