import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiUser, FiSettings, FiLogOut, FiX } from 'react-icons/fi';
import { TikTokConnection } from './TikTokConnection';

interface UserAvatarProps {
  username?: string;
  displayName?: string;
  onLogout?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  username, 
  displayName, 
  onLogout 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'connection'>('profile');

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    if (onLogout) {
      onLogout();
    }
    window.location.href = '/';
  };

  const getInitials = () => {
    if (displayName) {
      return displayName.split(' ').map(name => name[0]).join('').toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 border-2 border-white/10 hover:border-white/20"
        title={`${displayName || username || 'User'} - Click to manage account`}
      >
        {getInitials()}
      </button>

      {/* Modal */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/50 to-black/70 backdrop-blur-lg flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 9999 
          }}
        >
          <div 
            className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getInitials()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {displayName || username || 'User Account'}
                  </h2>
                  {username && (
                    <p className="text-white/60 text-sm">@{username}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-white border-b-2 border-purple-500 bg-white/5'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('connection')}
                className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'connection'
                    ? 'text-white border-b-2 border-purple-500 bg-white/5'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                Connection
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-white/60" />
                    <div>
                      <p className="text-white font-medium">Account Information</p>
                      <p className="text-white/60 text-sm">Manage your profile settings</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName || ''}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="Enter display name"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={username || ''}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        placeholder="Enter username"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'connection' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FiSettings className="w-5 h-5 text-white/60" />
                    <div>
                      <p className="text-white font-medium">TikTok Connection</p>
                      <p className="text-white/60 text-sm">Manage your TikTok account integration</p>
                    </div>
                  </div>
                  
                  {/* TikTok Connection Component */}
                  <div className="glass-card p-4 border border-white/10 rounded-lg">
                    <TikTokConnection />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-white/60 hover:text-white/80 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
