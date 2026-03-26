import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trophy, Users, ChevronRight, Sparkles, AlertCircle, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import MatchCard from '@/components/match/MatchCard';
import { Button } from '@/components/ui/button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if profile has playing_role set
  const { data: profile } = useQuery({
    queryKey: ['profile-role-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('playing_role, batting_style, bowling_style').eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const needsRoleUpdate = user && profile && !profile.playing_role;

  const { data: liveMatches } = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`*, team_a:teams!matches_team_a_id_fkey(id, name, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, logo_url)`)
        .eq('status', 'live')
        .order('match_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const liveMatchIds = (liveMatches || []).map((m: any) => m.id);

  const { data: liveInnings } = useQuery({
    queryKey: ['live-innings', liveMatchIds],
    queryFn: async () => {
      if (liveMatchIds.length === 0) return [];
      const { data } = await supabase
        .from('innings')
        .select('*')
        .in('match_id', liveMatchIds);
      return data || [];
    },
    enabled: liveMatchIds.length > 0,
    refetchInterval: 5000,
  });

  const getMatchScores = (match: any) => {
    if (!liveInnings) return {};
    const matchInnings = liveInnings.filter((i: any) => i.match_id === match.id);
    const innA = matchInnings.find((i: any) => i.batting_team_id === match.team_a_id);
    const innB = matchInnings.find((i: any) => i.batting_team_id === match.team_b_id);
    return {
      scoreA: innA ? { runs: innA.total_runs, wickets: innA.total_wickets, overs: innA.total_overs } : undefined,
      scoreB: innB ? { runs: innB.total_runs, wickets: innB.total_wickets, overs: innB.total_overs } : undefined,
    };
  };

  const { data: upcomingMatches } = useQuery({
    queryKey: ['matches', 'upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`*, team_a:teams!matches_team_a_id_fkey(id, name, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, logo_url)`)
        .eq('status', 'upcoming')
        .order('match_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: userTeams } = useQuery({
    queryKey: ['teams', 'user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('teams').select('*').eq('created_by', user.id).limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <MobileLayout>
      <PageHeader
        title="Dashboard"
        rightAction={
          <Button variant="ghost" size="icon" onClick={() => navigate('/search')} className="rounded-lg">
            <Search className="w-5 h-5" />
          </Button>
        }
      />

      <div className="px-4 py-6 space-y-6">
        {/* Role update notification */}
        {needsRoleUpdate && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">Complete your player profile</p>
              <p className="text-muted-foreground text-xs mt-0.5">Set your playing role, batting & bowling style so team managers can find you.</p>
              <Button variant="link" size="sm" className="px-0 h-auto text-amber-600" onClick={() => navigate('/profile')}>
                Update now →
              </Button>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">Cricket Scorer</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {user ? `Welcome back!` : 'Track Every Ball'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {user ? 'Ready to score your next match?' : 'Real-time scoring made simple'}
          </p>

          {!user && (
            <Button onClick={() => navigate('/auth')} className="mt-4 glow-primary">
              Get Started
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/matches/create')}
            className="flex items-center gap-3 p-4 rounded-xl bg-primary text-primary-foreground glow-primary transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="font-semibold">New Match</span>
          </button>
          <button
            onClick={() => navigate('/teams/create')}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="font-semibold">New Team</span>
          </button>
        </div>

        {/* Live Matches */}
        {liveMatches && liveMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-live"></span>
                </span>
                Live Now
              </h2>
              <button onClick={() => navigate('/matches?status=live')} className="text-sm text-primary font-medium flex items-center hover:underline">
                See all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {liveMatches.map((match) => (
                {(() => { const scores = getMatchScores(match); return <MatchCard key={match.id} id={match.id} name={match.name} teamA={match.team_a} teamB={match.team_b} matchDate={match.match_date} venue={match.venue} status={match.status as 'live'} overs={match.overs} scoreA={scores.scoreA} scoreB={scores.scoreB} />; })()}
              ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Upcoming
            </h2>
            <button onClick={() => navigate('/matches')} className="text-sm text-primary font-medium flex items-center hover:underline">
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {upcomingMatches && upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} id={match.id} name={match.name} teamA={match.team_a} teamB={match.team_b} matchDate={match.match_date} venue={match.venue} status={match.status as 'upcoming'} overs={match.overs} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 rounded-xl bg-card border border-border/50">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No upcoming matches</p>
              <Button variant="outline" onClick={() => navigate('/matches/create')} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create one now
              </Button>
            </div>
          )}
        </section>

        {/* My Teams */}
        {user && userTeams && userTeams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                My Teams
              </h2>
              <button onClick={() => navigate('/teams')} className="text-sm text-primary font-medium flex items-center hover:underline">
                See all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {userTeams.map((team) => (
                <button key={team.id} onClick={() => navigate(`/teams/${team.id}`)} className="flex-shrink-0 flex items-center gap-3 p-4 pr-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {team.name.charAt(0)}
                  </div>
                  <span className="font-medium">{team.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </MobileLayout>
  );
};

export default HomePage;
