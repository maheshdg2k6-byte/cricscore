import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Target, Zap, Activity, Trophy, Users, Swords, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const AllPlayerLeaderboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { data: topBatters, isLoading: loadingBat } = useQuery({
    queryKey: ['all-batting-leaderboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ball_by_ball')
        .select('batter_id, runs_scored, is_bye, is_leg_bye, is_wide, is_wicket, innings_id');
      if (!data) return [];
      const map = new Map<string, { runs: number; balls: number; dismissals: number; name?: string; userId?: string }>();
      data.forEach((b: any) => {
        if (!b.batter_id) return;
        const e = map.get(b.batter_id) || { runs: 0, balls: 0, dismissals: 0 };
        if (!b.is_bye && !b.is_leg_bye) e.runs += b.runs_scored;
        if (!b.is_wide) e.balls += 1;
        if (b.is_wicket) e.dismissals += 1;
        map.set(b.batter_id, e);
      });
      // Fetch player names
      const ids = Array.from(map.keys());
      if (ids.length === 0) return [];
      const { data: members } = await supabase.from('team_members').select('id, player_name, user_id').in('id', ids);
      (members || []).forEach((m: any) => {
        const e = map.get(m.id);
        if (e) { e.name = m.player_name; e.userId = m.user_id; }
      });
      return Array.from(map.entries())
        .map(([id, v]) => ({ id, ...v, sr: v.balls > 0 ? ((v.runs / v.balls) * 100).toFixed(1) : '0.0' }))
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 20);
    },
  });

  const { data: topBowlers, isLoading: loadingBowl } = useQuery({
    queryKey: ['all-bowling-leaderboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ball_by_ball')
        .select('bowler_id, runs_scored, is_wide, is_no_ball, is_wicket');
      if (!data) return [];
      const map = new Map<string, { wickets: number; runs: number; balls: number; name?: string; userId?: string }>();
      data.forEach((b: any) => {
        if (!b.bowler_id) return;
        const e = map.get(b.bowler_id) || { wickets: 0, runs: 0, balls: 0 };
        e.runs += b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0);
        if (b.is_wicket) e.wickets += 1;
        if (!b.is_wide && !b.is_no_ball) e.balls += 1;
        map.set(b.bowler_id, e);
      });
      const ids = Array.from(map.keys());
      if (ids.length === 0) return [];
      const { data: members } = await supabase.from('team_members').select('id, player_name, user_id').in('id', ids);
      (members || []).forEach((m: any) => {
        const e = map.get(m.id);
        if (e) { e.name = m.player_name; e.userId = m.user_id; }
      });
      return Array.from(map.entries())
        .map(([id, v]) => ({ id, ...v, econ: v.balls > 0 ? ((v.runs / v.balls) * 6).toFixed(2) : '-' }))
        .sort((a, b) => b.wickets - a.wickets)
        .slice(0, 20);
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <p className="text-sm font-semibold">🏏 Top Run Scorers</p>
        </div>
        {loadingBat ? <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div> : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-2 py-2 text-center">R</th>
                <th className="px-2 py-2 text-center">B</th>
                <th className="px-2 py-2 text-center">SR</th>
              </tr>
            </thead>
            <tbody>
              {(topBatters || []).map((p, i) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 cursor-pointer"
                  onClick={() => p.userId && navigate(`/profile/${p.userId}`)}>
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-medium max-w-[110px] truncate">{p.name || 'Unknown'}</td>
                  <td className="px-2 py-2 text-center font-bold">{p.runs}</td>
                  <td className="px-2 py-2 text-center">{p.balls}</td>
                  <td className="px-2 py-2 text-center text-muted-foreground">{p.sr}</td>
                </tr>
              ))}
              {(!topBatters || topBatters.length === 0) && (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-6">No data yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <p className="text-sm font-semibold">🎳 Top Wicket Takers</p>
        </div>
        {loadingBowl ? <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div> : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-2 py-2 text-center">W</th>
                <th className="px-2 py-2 text-center">R</th>
                <th className="px-2 py-2 text-center">Econ</th>
              </tr>
            </thead>
            <tbody>
              {(topBowlers || []).map((p, i) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 cursor-pointer"
                  onClick={() => p.userId && navigate(`/profile/${p.userId}`)}>
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-medium max-w-[110px] truncate">{p.name || 'Unknown'}</td>
                  <td className="px-2 py-2 text-center font-bold text-primary">{p.wickets}</td>
                  <td className="px-2 py-2 text-center">{p.runs}</td>
                  <td className="px-2 py-2 text-center text-muted-foreground">{p.econ}</td>
                </tr>
              ))}
              {(!topBowlers || topBowlers.length === 0) && (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-6">No data yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: myPlayerIds } = useQuery({
    queryKey: ['my-player-ids', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('team_members').select('id').eq('user_id', user.id);
      return data?.map(d => d.id) || [];
    },
    enabled: !!user,
  });

  const { data: battingStats } = useQuery({
    queryKey: ['my-batting-stats', myPlayerIds],
    queryFn: async () => {
      if (!myPlayerIds || myPlayerIds.length === 0) return null;
      const { data } = await supabase
        .from('ball_by_ball')
        .select('runs_scored, is_wide, is_no_ball, is_bye, is_leg_bye, is_wicket, innings_id, batter_id')
        .in('batter_id', myPlayerIds);
      if (!data || data.length === 0) return null;

      const inningsMap = new Map<string, { runs: number; balls: number; isOut: boolean }>();
      data.forEach(b => {
        const key = b.innings_id;
        const existing = inningsMap.get(key) || { runs: 0, balls: 0, isOut: false };
        if (!b.is_bye && !b.is_leg_bye) existing.runs += b.runs_scored;
        if (!b.is_wide) existing.balls += 1;
        if (b.is_wicket) existing.isOut = true;
        inningsMap.set(key, existing);
      });

      const inningsArr = Array.from(inningsMap.values());
      const totalRuns = inningsArr.reduce((s, i) => s + i.runs, 0);
      const totalBalls = inningsArr.reduce((s, i) => s + i.balls, 0);
      const dismissals = inningsArr.filter(i => i.isOut).length;
      const highestScore = inningsArr.reduce((max, i) => Math.max(max, i.runs), 0);
      const fifties = inningsArr.filter(i => i.runs >= 50 && i.runs < 100).length;
      const hundreds = inningsArr.filter(i => i.runs >= 100).length;
      const ducks = inningsArr.filter(i => i.runs === 0 && i.isOut).length;

      const fours = data.filter(b => b.runs_scored === 4 && !b.is_bye && !b.is_leg_bye && !b.is_wide).length;
      const sixes = data.filter(b => b.runs_scored === 6 && !b.is_bye && !b.is_leg_bye && !b.is_wide).length;

      return {
        innings: inningsArr.length,
        runs: totalRuns,
        balls: totalBalls,
        fours, sixes,
        dismissals,
        strikeRate: totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(1) : '-',
        average: dismissals > 0 ? (totalRuns / dismissals).toFixed(1) : totalRuns > 0 ? totalRuns.toFixed(1) : '-',
        highestScore, fifties, hundreds, ducks,
      };
    },
    enabled: !!myPlayerIds && myPlayerIds.length > 0,
  });

  const { data: bowlingStats } = useQuery({
    queryKey: ['my-bowling-stats', myPlayerIds],
    queryFn: async () => {
      if (!myPlayerIds || myPlayerIds.length === 0) return null;
      const { data } = await supabase
        .from('ball_by_ball')
        .select('runs_scored, is_wide, is_no_ball, is_wicket, innings_id, bowler_id, dismissal_type')
        .in('bowler_id', myPlayerIds);
      if (!data || data.length === 0) return null;

      const inningsSet = new Set(data.map(b => b.innings_id));
      const legalBalls = data.filter(b => !b.is_wide && !b.is_no_ball).length;
      const runsConceded = data.reduce((sum, b) => sum + b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0), 0);
      const wickets = data.filter(b => b.is_wicket).length;
      const economy = legalBalls > 0 ? (runsConceded / (legalBalls / 6)).toFixed(2) : '-';
      const average = wickets > 0 ? (runsConceded / wickets).toFixed(1) : '-';
      const sr = wickets > 0 ? (legalBalls / wickets).toFixed(1) : '-';

      // Best bowling: per innings
      const inningsWickets = new Map<string, { wickets: number; runs: number }>();
      data.forEach(b => {
        const key = b.innings_id;
        const existing = inningsWickets.get(key) || { wickets: 0, runs: 0 };
        existing.runs += b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0);
        if (b.is_wicket) existing.wickets += 1;
        inningsWickets.set(key, existing);
      });
      let bestWickets = 0, bestRuns = 999;
      inningsWickets.forEach(v => {
        if (v.wickets > bestWickets || (v.wickets === bestWickets && v.runs < bestRuns)) {
          bestWickets = v.wickets; bestRuns = v.runs;
        }
      });

      return {
        innings: inningsSet.size,
        overs: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
        runsConceded, wickets, economy, average, sr,
        wides: data.filter(b => b.is_wide).length,
        noBalls: data.filter(b => b.is_no_ball).length,
        bestBowling: bestWickets > 0 ? `${bestWickets}/${bestRuns}` : '-',
        threeWickets: Array.from(inningsWickets.values()).filter(v => v.wickets >= 3).length,
        fiveWickets: Array.from(inningsWickets.values()).filter(v => v.wickets >= 5).length,
      };
    },
    enabled: !!myPlayerIds && myPlayerIds.length > 0,
  });

  const { data: profileData } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('playing_role, batting_style, bowling_style').eq('user_id', user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const ROLE_LABELS: Record<string, string> = {
    batsman: 'Batsman', bowler: 'Bowler', allrounder: 'All-Rounder', wk_batsman: 'WK-Batsman',
    right_hand: 'Right Hand', left_hand: 'Left Hand',
    right_arm_fast: 'RA Fast', right_arm_medium: 'RA Medium', left_arm_fast: 'LA Fast',
    left_arm_medium: 'LA Medium', right_arm_off_spin: 'RA Off Spin', right_arm_leg_spin: 'RA Leg Spin',
    left_arm_spin: 'LA Spin', left_arm_chinaman: 'LA Chinaman',
  };

  const StatBox = ({ label, value }: { label: string; value: string | number }) => (
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );

  return (
    <MobileLayout>
      <PageHeader title="My Statistics" />
      <div className="px-4 py-4 space-y-6">
        {user ? (
          <>
            {profileData && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary to-accent rounded-2xl p-5 text-primary-foreground">
                <h3 className="font-bold text-lg">{user.user_metadata?.full_name || 'Player'}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profileData.playing_role && <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">{ROLE_LABELS[profileData.playing_role] || profileData.playing_role}</span>}
                  {profileData.batting_style && <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">{ROLE_LABELS[profileData.batting_style] || profileData.batting_style}</span>}
                  {profileData.bowling_style && <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">{ROLE_LABELS[profileData.bowling_style] || profileData.bowling_style}</span>}
                </div>
              </motion.div>
            )}

            <Tabs defaultValue="batting" className="mt-2">
              <TabsList className="w-full grid grid-cols-3 h-12 rounded-xl">
                <TabsTrigger value="batting" className="rounded-lg"><Swords className="w-4 h-4 mr-1.5" />Batting</TabsTrigger>
                <TabsTrigger value="bowling" className="rounded-lg"><Target className="w-4 h-4 mr-1.5" />Bowling</TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg"><Users className="w-4 h-4 mr-1.5" />All Players</TabsTrigger>
              </TabsList>

              <TabsContent value="batting" className="mt-4">
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />My Batting</h3>
                  {battingStats ? (
                    <div className="grid grid-cols-3 gap-4">
                      <StatBox label="Innings" value={battingStats.innings} />
                      <StatBox label="Total Runs" value={battingStats.runs} />
                      <StatBox label="Average" value={battingStats.average} />
                      <StatBox label="Strike Rate" value={battingStats.strikeRate} />
                      <StatBox label="Highest" value={battingStats.highestScore} />
                      <StatBox label="Balls Faced" value={battingStats.balls} />
                      <StatBox label="Fours" value={battingStats.fours} />
                      <StatBox label="Sixes" value={battingStats.sixes} />
                      <StatBox label="50s" value={battingStats.fifties} />
                      <StatBox label="100s" value={battingStats.hundreds} />
                      <StatBox label="Ducks" value={battingStats.ducks} />
                      <StatBox label="Dismissals" value={battingStats.dismissals} />
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">No batting stats yet. Play some matches!</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="bowling" className="mt-4">
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-primary" />My Bowling</h3>
                  {bowlingStats ? (
                    <div className="grid grid-cols-3 gap-4">
                      <StatBox label="Innings" value={bowlingStats.innings} />
                      <StatBox label="Wickets" value={bowlingStats.wickets} />
                      <StatBox label="Economy" value={bowlingStats.economy} />
                      <StatBox label="Average" value={bowlingStats.average} />
                      <StatBox label="Strike Rate" value={bowlingStats.sr} />
                      <StatBox label="Overs" value={bowlingStats.overs} />
                      <StatBox label="Runs Conceded" value={bowlingStats.runsConceded} />
                      <StatBox label="Best Bowling" value={bowlingStats.bestBowling} />
                      <StatBox label="3W Hauls" value={bowlingStats.threeWickets} />
                      <StatBox label="5W Hauls" value={bowlingStats.fiveWickets} />
                      <StatBox label="Wides" value={bowlingStats.wides} />
                      <StatBox label="No Balls" value={bowlingStats.noBalls} />
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground text-sm py-4">No bowling stats yet. Bowl in some matches!</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="all" className="mt-4 space-y-3">
                <AllPlayerLeaderboard navigate={navigate} />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-semibold text-xl mb-2">Track Your Stats</h3>
            <p className="text-muted-foreground mb-6">Sign in to view your personal statistics</p>
            <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Zap className="w-4 h-4 mr-2" /> Sign In
            </Button>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
};

export default StatsPage;
