import React, { useState, useEffect } from 'react';
import { FiExternalLink, FiCheck, FiX, FiAlertCircle, FiLoader } from 'react-icons/fi';

interface TikTokConnectionStatus {
  connected: boolean;
  username?: string;
  displayName?: string;
  connectedAt?: string;
  planType: string;
  videosAllowed: number;
  tokenExpired?: boolean;
}

interface TikTokConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
}

export const TikTokConnection: React.FC<TikTokConnectionProps> = ({ onConnectionChange }) => {
  const [status, setStatus] = useState<TikTokConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setStatus(null);
        return;
      }

      const response = await fetch('/api/auth/tiktok/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        onConnectionChange?.(data.connected);
      } else {
        throw new Error('Failed to fetch TikTok connection status');
      }
    } catch (err) {
      console.error('Error fetching TikTok status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/auth/tiktok/connect-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to TikTok OAuth
        window.location.href = data.authUrl;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate OAuth URL');
      }
    } catch (err) {
      console.error('Error connecting TikTok:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect TikTok account');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/auth/tiktok/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchStatus(); // Refresh status
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect TikTok account');
      }
    } catch (err) {
      console.error('Error disconnecting TikTok:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect TikTok account');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle OAuth callback success/error from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tiktokConnected = urlParams.get('tiktok_connected');
    const tiktokError = urlParams.get('tiktok_error');

    if (tiktokConnected === 'true') {
      fetchStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (tiktokError === 'true') {
      setError('Failed to connect TikTok account. Please try again.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <FiLoader className="w-5 h-5 text-white/50 animate-spin" />
          <span className="text-white/70">Checking TikTok connection...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-4 border border-red-500/20">
        <div className="flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-400" />
          <div className="flex-1">
            <p className="text-red-400 font-medium">Connection Error</p>
            <p className="text-red-300/70 text-sm">{error}</p>
          </div>
          <button
            onClick={fetchStatus}
            className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="glass-card p-4 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <p className="text-white font-medium">Connect Your TikTok Account</p>
              <p className="text-white/60 text-sm">Get AI insights</p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiExternalLink className="w-4 h-4" />
            )}
            {connecting ? 'Connecting...' : 'Connect TikTok'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 border border-green-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-medium">@{status.username}</p>
              <FiCheck className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-white/60 text-sm">
              {status.planType === 'free' ? 'Free Plan' : 'Premium Plan'} • {status.videosAllowed} videos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status.tokenExpired && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">
              <FiAlertCircle className="w-3 h-3" />
              Token Expired
            </div>
          )}
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1 px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
          >
            <FiX className="w-3 h-3" />
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};
