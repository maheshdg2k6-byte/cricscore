import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Trophy, User, Plus, X } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/matches', icon: Calendar, label: 'Matches' },
  { to: '/tournaments', icon: Trophy, label: 'Tourneys' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleCreate = (path: string) => {
    setShowCreate(false);
    navigate(path);
  };

  return (
    <>
      {/* Create Menu Overlay */}
      {showCreate && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setShowCreate(false)}
        />
      )}

      {/* Create Options */}
      {showCreate && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center animate-fade-in">
          <button
            onClick={() => handleCreate('/matches/create')}
            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border shadow-lg hover:border-primary/30 transition-all"
          >
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium">New Match</span>
          </button>
          <button
            onClick={() => handleCreate('/tournaments/create')}
            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card border border-border shadow-lg hover:border-primary/30 transition-all"
          >
            <Trophy className="w-5 h-5 text-accent" />
            <span className="font-medium">New Tournament</span>
          </button>
        </div>
      )}

      <nav className="bottom-nav z-50">
        <div className="flex items-center justify-around px-4 py-2 relative">
          {/* Left nav items */}
          {navItems.slice(0, 2).map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive(item.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}

          {/* Center Create Button */}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`flex items-center justify-center w-14 h-14 -mt-6 rounded-full shadow-lg transition-all duration-200 ${
              showCreate 
                ? 'bg-secondary text-foreground rotate-45' 
                : 'bg-primary text-primary-foreground glow-primary'
            }`}
          >
            {showCreate ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>

          {/* Right nav items */}
          {navItems.slice(2).map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive(item.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
