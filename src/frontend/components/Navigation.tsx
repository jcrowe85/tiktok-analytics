import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBarChart, FiSearch, FiSettings, FiUser, FiTrendingUp, FiFile } from 'react-icons/fi';

interface NavigationProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export function Navigation({ sidebarCollapsed, setSidebarCollapsed }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
      path: '/', 
      label: 'My Videos', 
      icon: FiBarChart,
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
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleNavClick = (path: string) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar on navigation
  };

  const primaryItems = navItems.filter(item => item.category === 'primary');
  const secondaryItems = navItems.filter(item => item.category === 'secondary');
  const tertiaryItems = navItems.filter(item => item.category === 'tertiary');

  return (
    <>
      {/* Top Header - Only on mobile */}
      <nav className="glass-card border-0 border-b border-white/10 rounded-none relative z-50 md:hidden">
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
              
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TikTok Analytics
              </h1>
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

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 z-50 transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:fixed md:top-0 md:left-0 md:h-screen md:bg-black/20 md:border-r md:border-white/10 
        ${sidebarCollapsed ? 'md:w-16' : 'md:w-64 lg:w-72'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`flex items-center justify-between p-6 border-b border-white/10 ${sidebarCollapsed ? 'md:px-3' : ''}`}>
            {!sidebarCollapsed && (
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                TikTok Analytics
              </h1>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors hidden md:flex"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <FiMenu className="w-4 h-4 text-white/80" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors md:hidden"
              >
                <FiX className="w-5 h-5 text-white/80" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className={`flex-1 space-y-6 overflow-y-auto ${sidebarCollapsed ? 'md:p-2' : 'p-4'}`}>
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
                        ${sidebarCollapsed ? 'md:px-2 md:justify-center' : ''}
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
                          ${sidebarCollapsed ? 'md:px-2 md:justify-center' : ''}
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
                          ${sidebarCollapsed ? 'md:px-2 md:justify-center' : ''}
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
    </>
  );
}

