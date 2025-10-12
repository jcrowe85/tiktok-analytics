import { Link, useLocation, useNavigate } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  console.log('Navigation rendered, current path:', location.pathname);
  
  const navItems = [
    { path: '/', label: 'My Videos', icon: '🎥' },
    { path: '/ad-hoc', label: 'Ad-Hoc Analysis', icon: '🔍' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const handleNavClick = (path: string) => {
    alert(`Clicked! Navigating to: ${path}`);
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <nav className="glass-card border-0 border-b border-white/10 rounded-none relative z-50">
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">TA</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              TikTok Analytics
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`
                  px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer
                  ${isActive(item.path)
                    ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10'
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
                <span className="text-sm font-medium hidden sm:inline">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

