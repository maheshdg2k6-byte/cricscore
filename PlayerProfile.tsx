import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, BarChart3, Medal, Users, Image, Link2 } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman', bowler: 'Bowler', allrounder: 'All-Rounder', wk_batsman: 'WK-Batsman',
};
const BAT_LABELS: Record<string, string> = { right_hand: 'Right Hand', left_hand: 'Left Hand' };
const BOWL_LABELS: Record<string, string> = {
  right_arm_fast: 'Right Arm Fast', right_arm_medium: 'Right Arm Medium', left_arm_fast: 'Left Arm Fast',
  left_arm_medium: 'Left Arm Medium', right_arm_off_spin: 'Right Arm Off Spin', right_arm_leg_spin: 'Right Arm Leg Spin',
  left_arm_spin: 'Left Arm Spin', left_arm_chinaman: 'Left Arm Chinaman',
};

const PlayerProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['player-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: teamMemberships } = useQuery({
    queryKey: ['player-teams', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('team_members')
        .select('*, team:teams(id, name, logo_url)')
        .eq('user_id', userId);
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: matchStats } = useQuery({
    queryKey: ['player-match-stats', userId],
    queryFn: async () => {
      // Get all balls where this user was batter or bowler
      const memberIds = (teamMemberships || []).map((m: any) => m.id);
      if (memberIds.length === 0) return null;
      const { data: balls } = await supabase
        .from('ball_by_ball')
        .select('*')
        .or(`batter_id.in.(${memberIds.join(',')}),bowler_id.in.(${memberIds.join(',')})`);

      const allBalls = balls || [];
      const battingBalls = allBalls.filter((b: any) => memberIds.includes(b.batter_id));
      const bowlingBalls = allBalls.filter((b: any) => memberIds.includes(b.bowler_id));

      const totalRuns = battingBalls.reduce((s: number, b: any) => s + (!b.is_bye && !b.is_leg_bye ? b.runs_scored : 0), 0);
      const ballsFaced = battingBalls.filter((b: any) => !b.is_wide).length;
      const fours = battingBalls.filter((b: any) => b.runs_scored === 4 && !b.is_bye && !b.is_leg_bye && !b.is_wide).length;
      const sixes = battingBalls.filter((b: any) => b.runs_scored === 6 && !b.is_bye && !b.is_leg_bye && !b.is_wide).length;
      const wickets = bowlingBalls.filter((b: any) => b.is_wicket).length;
      const legalBowled = bowlingBalls.filter((b: any) => !b.is_wide && !b.is_no_ball).length;
      const runsConceded = bowlingBalls.reduce((s: number, b: any) => s + b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0), 0);

      return {
        totalRuns, ballsFaced, fours, sixes,
        sr: ballsFaced > 0 ? ((totalRuns / ballsFaced) * 100).toFixed(1) : '0.0',
        wickets, legalBowled,
        overs: `${Math.floor(legalBowled / 6)}.${legalBowled % 6}`,
        economy: legalBowled > 0 ? ((runsConceded / legalBowled) * 6).toFixed(2) : '0.00',
        runsConceded,
      };
    },
    enabled: !!teamMemberships && teamMemberships.length > 0,
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <PageHeader title="Player Profile" showBack />
        <div className="p-4 space-y-4">
          <div className="h-40 rounded-2xl bg-secondary animate-pulse" />
        </div>
      </MobileLayout>
    );
  }

  if (!profile) {
    return (
      <MobileLayout>
        <PageHeader title="Player Profile" showBack />
        <div className="p-8 text-center text-muted-foreground">Player not found</div>
      </MobileLayout>
    );
  }

  const initials = profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'PL';

  return (
    <MobileLayout showNav={false}>
      <PageHeader title={profile.full_name || 'Player'} showBack />

      <div className="px-4 py-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary-foreground/20 border-2 border-primary-foreground/40 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold">{initials}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{profile.full_name}</h2>
              {profile.playing_role && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary-foreground/20 text-xs font-medium">
                  {ROLE_LABELS[profile.playing_role] || profile.playing_role}
                </span>
              )}
              {(teamMemberships || []).length > 0 && (
                <p className="text-xs opacity-75 mt-1">{(teamMemberships || []).length} team{(teamMemberships || []).length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="matches" className="mt-2">
          <TabsList className="w-full overflow-x-auto flex h-10 rounded-xl gap-1 justify-start px-1 bg-secondary">
            <TabsTrigger value="matches" className="rounded-lg text-xs flex-shrink-0 flex items-center gap-1"><User className="w-3 h-3" />Matches</TabsTrigger>
            <TabsTrigger value="stats" className="rounded-lg text-xs flex-shrink-0 flex items-center gap-1"><BarChart3 className="w-3 h-3" />Stats</TabsTrigger>
            <TabsTrigger value="awards" className="rounded-lg text-xs flex-shrink-0 flex items-center gap-1"><Trophy className="w-3 h-3" />Awards</TabsTrigger>
            <TabsTrigger value="teams" className="rounded-lg text-xs flex-shrink-0 flex items-center gap-1"><Users className="w-3 h-3" />Teams</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg text-xs flex-shrink-0 flex items-center gap-1"><Medal className="w-3 h-3" />Profile</TabsTrigger>
          </TabsList>

          {/* Matches Tab */}
          <TabsContent value="matches" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">Match Stats Summary</h3>
              {matchStats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{matchStats.totalRuns}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Runs</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{matchStats.wickets}</div>
                    <div className="text-xs text-muted-foreground mt-1">Wickets</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{matchStats.fours}</div>
                    <div className="text-xs text-muted-foreground mt-1">Fours</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold">{matchStats.sixes}</div>
                    <div className="text-xs text-muted-foreground mt-1">Sixes</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No match data yet</p>
              )}
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-4 space-y-3">
            {matchStats ? (
              <>
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">🏏 Batting</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Runs', value: matchStats.totalRuns },
                      { label: 'Balls Faced', value: matchStats.ballsFaced },
                      { label: 'Strike Rate', value: matchStats.sr },
                      { label: 'Fours', value: matchStats.fours },
                      { label: 'Sixes', value: matchStats.sixes },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">🎳 Bowling</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Wickets', value: matchStats.wickets },
                      { label: 'Overs', value: matchStats.overs },
                      { label: 'Runs Conceded', value: matchStats.runsConceded },
                      { label: 'Economy', value: matchStats.economy },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No stats available yet</div>
            )}
          </TabsContent>

          {/* Awards Tab */}
          <TabsContent value="awards" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-4 text-center py-10">
              <Trophy className="w-10 h-10 mx-auto mb-3 text-amber-400" />
              <p className="text-muted-foreground text-sm">Awards will show here once earned in matches</p>
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-4 space-y-2">
            {teamMemberships && teamMemberships.length > 0 ? (
              teamMemberships.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/teams/${m.team?.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm overflow-hidden">
                    {m.team?.logo_url
                      ? <img src={m.team.logo_url} alt="" className="w-full h-full object-cover" />
                      : m.team?.name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{m.team?.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {m.is_captain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600">Captain</span>}
                      {m.is_wicket_keeper && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">WK</span>}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">Not part of any teams yet</div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span className="font-medium">{profile.full_name || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium">{ROLE_LABELS[profile.playing_role] || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Batting</span><span className="font-medium">{BAT_LABELS[profile.batting_style] || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bowling</span><span className="font-medium">{BOWL_LABELS[profile.bowling_style] || '—'}</span></div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default PlayerProfilePage;
