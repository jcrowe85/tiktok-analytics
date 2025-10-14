import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBarChart, FiSearch, FiSettings, FiUser, FiTrendingUp, FiFile, FiLogOut, FiVideo } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export function Navigation({ sidebarCollapsed, setSidebarCollapsed }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    // Initialize with proper mobile detection
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });
  
  // Detect mobile vs desktop
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      const wasMobile = isMobile;
      console.log('📱 Screen width:', window.innerWidth, 'isMobile:', mobile, 'wasMobile:', wasMobile, 'sidebarOpen:', sidebarOpen);
      
      // Only auto-close if transitioning FROM desktop TO mobile
      if (mobile && !wasMobile && sidebarOpen) {
        console.log('🔧 Auto-closing mobile sidebar on resize from desktop to mobile');
        setSidebarOpen(false);
      }
      
      setIsMobile(mobile);
    };
    
    // Run immediately and on resize
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [isMobile, sidebarOpen]); // Track both isMobile and sidebarOpen

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);
  
  // Organized by priority and user flow
  const navItems = [
    { 
      path: '/my-videos', 
      label: 'My Videos', 
      icon: FiVideo,
      category: 'primary',
      enabled: true
    },
    { 
      path: '/ad-hoc', 
      label: 'Analyze URL', 
      icon: FiSearch,
      category: 'primary',
      enabled: true
    },
    { 
      path: '/reports', 
      label: 'Reports', 
      icon: FiTrendingUp,
      category: 'secondary',
      enabled: false
    },
    { 
      path: '/analytics', 
      label: 'Advanced Analytics', 
      icon: FiFile,
      category: 'secondary',
      enabled: false
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: FiSettings,
      category: 'tertiary',
      enabled: false
    },
    { 
      path: '/account', 
      label: 'Account', 
      icon: FiUser,
      category: 'tertiary',
      enabled: false
    },
    { 
      path: '/logout', 
      label: 'Logout', 
      icon: FiLogOut,
      category: 'tertiary',
      enabled: true,
      isLogout: true
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleNavClick = (path: string) => {
    if (path === '/logout') {
      logout();
      setSidebarOpen(false); // Close sidebar on logout
      return;
    }
    navigate(path);
    setSidebarOpen(false); // Close sidebar on navigation
  };

  const primaryItems = navItems.filter(item => item.category === 'primary');
  const secondaryItems = navItems.filter(item => item.category === 'secondary');
  const tertiaryItems = navItems.filter(item => item.category === 'tertiary');

  return (
    <>
      {/* Top Header - Only on mobile */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10 relative z-50 md:hidden">
        {/* DEBUG: Mobile header - should only show on mobile */}
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Menu Button + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <FiMenu className="w-5 h-5 text-white/80" />
              </button>
              
              <div className="flex flex-col">
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  TikTok Analytics
                </h1>
                {user && (
                  <p className="text-xs text-white/50 truncate max-w-[200px]">
                    {user.name || user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          onTouchEnd={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 z-50 transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:hidden
      `}>
        {/* DEBUG: Mobile sidebar - sidebarOpen: {sidebarOpen.toString()}, isMobile: {isMobile.toString()} */}
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              TikTok Analytics
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <FiX className="w-5 h-5 text-white/80" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {/* Primary Navigation */}
            <div>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">Main</h3>
              <div className="space-y-1">
                {primaryItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => item.enabled && handleNavClick(item.path)}
                      disabled={!item.enabled}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                        ${!item.enabled 
                          ? 'text-white/30 cursor-not-allowed opacity-50'
                          : isActive(item.path)
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">
                        {item.label}
                        {!item.enabled && <span className="text-xs text-white/30 ml-1">(Soon)</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Navigation */}
            {secondaryItems.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">Analytics</h3>
                <div className="space-y-1">
                  {secondaryItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => item.enabled && handleNavClick(item.path)}
                        disabled={!item.enabled}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                          ${!item.enabled 
                            ? 'text-white/30 cursor-not-allowed opacity-50'
                            : isActive(item.path)
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }
                        `}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="font-medium">
                          {item.label}
                          {!item.enabled && <span className="text-xs text-white/30 ml-1">(Soon)</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tertiary Navigation */}
            {tertiaryItems.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">Account</h3>
                <div className="space-y-1">
                  {tertiaryItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => item.enabled && handleNavClick(item.path)}
                        disabled={!item.enabled}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                          ${!item.enabled 
                            ? 'text-white/30 cursor-not-allowed opacity-50'
                            : isActive(item.path)
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }
                        `}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="font-medium">
                          {item.label}
                          {!item.enabled && <span className="text-xs text-white/30 ml-1">(Soon)</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      {console.log('🔍 Rendering desktop sidebar check - isMobile:', isMobile, 'will render:', !isMobile)}
      {!isMobile && (
        <div 
          className={`
            fixed top-0 left-0 h-screen bg-black/20 backdrop-blur-xl border-r border-white/10 z-40 transform transition-all duration-300 ease-in-out
            ${sidebarCollapsed ? 'w-16' : 'w-64 lg:w-72'}
          `}
          style={{ 
            display: isMobile ? 'none' : 'flex',
            visibility: isMobile ? 'hidden' : 'visible',
            opacity: isMobile ? '0' : '1'
          }}
        >
          {/* DEBUG: Desktop sidebar should NOT be visible on mobile! isMobile: {isMobile.toString()}, width: {typeof window !== 'undefined' ? window.innerWidth : 'unknown'} */}
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`flex flex-col p-6 border-b border-white/10 ${sidebarCollapsed ? 'px-3' : ''}`}>
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  TikTok Analytics
                </h1>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <FiMenu className="w-4 h-4 text-white/80" />
                </button>
              </div>
            </div>
            {user && !sidebarCollapsed && (
              <div className="mt-2 text-sm text-white/60 truncate">
                {user.name || user.email}
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className={`flex-1 space-y-6 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {/* Primary Navigation */}
            <div>
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">Main</h3>
              )}
              <div className="space-y-1">
                {primaryItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => item.enabled && handleNavClick(item.path)}
                      disabled={!item.enabled}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                        ${sidebarCollapsed ? 'px-2 justify-center' : ''}
                        ${!item.enabled 
                          ? 'text-white/30 cursor-not-allowed opacity-50'
                          : isActive(item.path)
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }
                      `}
                      title={sidebarCollapsed ? `${item.label}${!item.enabled ? ' (Coming Soon)' : ''}` : ''}
                    >
                      <IconComponent className="w-5 h-5" />
                      {!sidebarCollapsed && (
                        <span className="font-medium">
                          {item.label}
                          {!item.enabled && <span className="text-xs text-white/30 ml-1">(Soon)</span>}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secondary Navigation */}
            {secondaryItems.length > 0 && (
              <div>
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">Analytics</h3>
                )}
                <div className="space-y-1">
                  {secondaryItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => item.enabled && handleNavClick(item.path)}
                        disabled={!item.enabled}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                          ${sidebarCollapsed ? 'px-2 justify-center' : ''}
                          ${!item.enabled 
                            ? 'text-white/30 cursor-not-allowed opacity-50'
                            : isActive(item.path)
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }
                        `}
                        title={sidebarCollapsed ? `${item.label}${!item.enabled ? ' (Coming Soon)' : ''}` : ''}
                      >
                        <IconComponent className="w-5 h-5" />
                        {!sidebarCollapsed && (
                          <span className="font-medium">
                            {item.label}
                            {!item.enabled && <span className="text-xs text-white/30 ml-1">(Soon)</span>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tertiary Navigation */}
            {tertiaryItems.length > 0 && (
              <div>
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 px-3">Account</h3>
                )}
                <div className="space-y-1">
                  {tertiaryItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => item.enabled && handleNavClick(item.path)}
                        disabled={!item.enabled}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                          ${sidebarCollapsed ? 'px-2 justify-center' : ''}
                          ${!item.enabled 
                            ? 'text-white/30 cursor-not-allowed opacity-50'
                            : isActive(item.path)
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }
                        `}
                        title={sidebarCollapsed ? `${item.label}${!item.enabled ? ' (Coming Soon)' : ''}` : ''}
                      >
                        <IconComponent className="w-5 h-5" />
                        {!sidebarCollapsed && (
                          <span className="font-medium">
                            {item.label}
                            {!item.enabled && <span className="text-xs text-white/30 ml-1">(Soon)</span>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}

