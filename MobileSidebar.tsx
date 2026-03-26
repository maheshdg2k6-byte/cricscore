import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, Home, Trophy, Users, Plus, User, BarChart3, Calendar, Mail, Shield, Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const OWNER_EMAIL = 'maheshdg2k6@gmail.com';
  const isOwner = user?.email === OWNER_EMAIL;

  const { data: myTeams } = useQuery({
    queryKey: ['sidebar-my-teams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('teams').select('id, name').eq('created_by', user.id).limit(5);
      return data || [];
    },
    enabled: !!user && isOpen,
  });

  const { data: myTournaments } = useQuery({
    queryKey: ['sidebar-my-tournaments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('tournaments').select('id, name').eq('created_by', user.id).limit(5);
      return data || [];
    },
    enabled: !!user && isOpen,
  });

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Matches', path: '/matches' },
    { icon: Users, label: 'Teams', path: '/teams' },
    { icon: Trophy, label: 'Tournaments', path: '/tournaments' },
    { icon: BarChart3, label: 'Statistics', path: '/stats' },
    ...(isOwner ? [{ icon: Mail, label: 'Email Templates', path: '/email-templates' }] : []),
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const quickActions = [
    { icon: Plus, label: 'New Match', path: '/matches/create' },
    { icon: Users, label: 'New Team', path: '/teams/create' },
    { icon: Trophy, label: 'New Tournament', path: '/tournaments/create' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActivePath = (path: string) => location.pathname === path;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-72 bg-card border-l border-border">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Cricket Scorer</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          {user && (
            <div className="p-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Quick Actions</p>
              <div className="space-y-1">
                {quickActions.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation + My Teams/Tournaments */}
          <div className="flex-1 p-4 overflow-y-auto space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Navigation</p>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* My Teams */}
            {user && myTeams && myTeams.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">My Teams</p>
                <div className="space-y-1">
                  {myTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => handleNavigation(`/teams/${team.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <Shield className="w-4 h-4 text-accent" />
                      <span className="truncate">{team.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* My Tournaments */}
            {user && myTournaments && myTournaments.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">My Tournaments</p>
                <div className="space-y-1">
                  {myTournaments.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleNavigation(`/tournaments/${t.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!user && (
            <div className="p-4 border-t border-border">
              <button
                onClick={() => handleNavigation('/auth')}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
