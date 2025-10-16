import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiUser, FiX, FiPhone, FiInfo } from 'react-icons/fi';

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
  const [activeTab, setActiveTab] = useState<'account' | 'phone' | 'theme'>('account');
  const [selectedAvatar, setSelectedAvatar] = useState('#3f51b5'); // Default blue avatar

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

  const avatarColors = [
    '#ef5350', '#ff7043', '#ab47bc', '#7e57c2', '#5c6bc0', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
    '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#795548', '#607d8b'
  ];

  return (
    <>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg transition-all duration-200 border-2 border-white/10 hover:border-white/20"
        style={{ backgroundColor: selectedAvatar }}
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
            className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-2xl border border-white/25 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="flex h-[600px]">
              {/* Left Navigation Sidebar */}
              <div className="w-64 bg-gray-800/80 backdrop-blur-sm border-r border-white/15 p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === 'account'
                        ? 'bg-white/10 text-white border-l-4 border-purple-500'
                        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <FiUser className="w-5 h-5" />
                    Account
                  </button>
                  <button
                    onClick={() => setActiveTab('phone')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === 'phone'
                        ? 'bg-white/10 text-white border-l-4 border-purple-500'
                        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <FiPhone className="w-5 h-5" />
                    Phone
                  </button>
                  <button
                    onClick={() => setActiveTab('theme')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === 'theme'
                        ? 'bg-white/10 text-white border-l-4 border-purple-500'
                        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <FiInfo className="w-5 h-5" />
                    Theme
                  </button>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold text-white mb-6">Account</h3>
                
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    {/* Badge Section */}
                    <div>
                      <h4 className="text-white font-semibold mb-4">Badge</h4>
                      <div className="flex items-center gap-4 mb-4">
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: selectedAvatar }}
                        >
                          {getInitials()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{displayName || username || 'User'}</p>
                          <p className="text-white/60 text-sm">{username ? `@${username}` : 'No username set'}</p>
                        </div>
                      </div>
                      
                      {/* Avatar Color Grid */}
                      <div className="grid grid-cols-6 gap-3">
                        {avatarColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedAvatar(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                              selectedAvatar === color 
                                ? 'border-white scale-110 shadow-lg' 
                                : 'border-white/20 hover:border-white/40 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Name Section */}
                    <div>
                      <h4 className="text-white font-semibold mb-2">Name</h4>
                      <p className="text-white/80">{displayName || 'No name set'}</p>
                    </div>

                    {/* Email Section */}
                    <div>
                      <h4 className="text-white font-semibold mb-2">Email</h4>
                      <p className="text-white/80">{username || 'No email set'}</p>
                    </div>

                    {/* Password Section */}
                    <div>
                      <h4 className="text-white font-semibold mb-2">Password</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-white/60">••••••••</span>
                        <button className="text-purple-400 hover:text-purple-300 text-sm">
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Delete Account Section */}
                    <div className="pt-6 border-t border-white/10">
                      <h4 className="text-white font-semibold mb-2">Delete Account</h4>
                      <p className="text-white/60 text-sm mb-4">
                        This action will delete all of your data and cannot be undone.
                      </p>
                      <button 
                        onClick={handleLogout}
                        className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        Delete Account?
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'phone' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FiPhone className="w-5 h-5 text-white/60" />
                      <div>
                        <p className="text-white font-medium">Phone Settings</p>
                        <p className="text-white/60 text-sm">Manage your phone number and notifications</p>
                      </div>
                    </div>
                    <p className="text-white/60">Phone settings coming soon...</p>
                  </div>
                )}

                {activeTab === 'theme' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FiInfo className="w-5 h-5 text-white/60" />
                      <div>
                        <p className="text-white font-medium">Theme Settings</p>
                        <p className="text-white/60 text-sm">Customize your app appearance</p>
                      </div>
                    </div>
                    <p className="text-white/60">Theme settings coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
