import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Settings, Users, FileText, Trash2, User, Trophy, Award, Search } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import EditModal from '@/components/shared/EditModal';
import { toast } from '@/hooks/use-toast';

const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', venue: '', overs: 20, match_date: '', time: '' });
  const [squadOpen, setSquadOpen] = useState(false);
  const [selectedSquadA, setSelectedSquadA] = useState<Set<string>>(new Set());
  const [selectedSquadB, setSelectedSquadB] = useState<Set<string>>(new Set());
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`*, team_a:teams!matches_team_a_id_fkey(id, name, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, logo_url)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: innings } = useQuery({
    queryKey: ['innings', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('innings').select('*').eq('match_id', id).order('innings_number');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchInterval: match?.status === 'live' ? 3000 : false,
  });

  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile', match?.created_by],
    queryFn: async () => {
      if (!match?.created_by) return null;
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', match.created_by).maybeSingle();
      return data;
    },
    enabled: !!match?.created_by,
  });

  const { data: allBalls } = useQuery({
    queryKey: ['match-balls', id, innings],
    queryFn: async () => {
      if (!innings || innings.length === 0) return {};
      const result: Record<string, any[]> = {};
      for (const inn of innings) {
        const { data } = await supabase.from('ball_by_ball')
          .select('*').eq('innings_id', inn.id).order('over_number').order('ball_number');
        result[inn.id] = data || [];
      }
      return result;
    },
    enabled: !!innings && innings.length > 0,
    refetchInterval: match?.status === 'live' ? 3000 : false,
  });

  const { data: allPlayers } = useQuery({
    queryKey: ['match-players', match?.team_a_id, match?.team_b_id],
    queryFn: async () => {
      if (!match) return {};
      const ids = [match.team_a_id, match.team_b_id].filter(Boolean);
      if (ids.length === 0) return {};
      const { data } = await supabase.from('team_members').select('id, player_name, playing_role, batting_style, bowling_style, team_id, is_captain, is_wicket_keeper, user_id').in('team_id', ids);
      const map: Record<string, any> = {};
      data?.forEach(p => { map[p.id] = p; });
      return map;
    },
    enabled: !!match,
  });

  const { data: teamAMembers } = useQuery({
    queryKey: ['team-a-members', match?.team_a_id],
    queryFn: async () => {
      if (!match?.team_a_id) return [];
      const { data } = await supabase.from('team_members').select('*').eq('team_id', match.team_a_id).order('player_name');
      return data || [];
    },
    enabled: !!match?.team_a_id,
  });

  const { data: teamBMembers } = useQuery({
    queryKey: ['team-b-members', match?.team_b_id],
    queryFn: async () => {
      if (!match?.team_b_id) return [];
      const { data } = await supabase.from('team_members').select('*').eq('team_id', match.team_b_id).order('player_name');
      return data || [];
    },
    enabled: !!match?.team_b_id,
  });

  // Auto-calculate awards for completed matches
  const autoAwards = useMemo(() => {
    if (!innings || innings.length === 0 || !allBalls || !allPlayers || match?.status !== 'completed') return [];
    
    const playerBatting = new Map<string, { runs: number; balls: number; fours: number; sixes: number }>();
    const playerBowling = new Map<string, { wickets: number; runs: number; legalBalls: number }>();
    const playerCatches = new Map<string, number>();

    Object.values(allBalls).flat().forEach((b: any) => {
      if (b.batter_id) {
        const existing = playerBatting.get(b.batter_id) || { runs: 0, balls: 0, fours: 0, sixes: 0 };
        if (!b.is_bye && !b.is_leg_bye) existing.runs += b.runs_scored;
        if (!b.is_wide) existing.balls += 1;
        if (b.runs_scored === 4 && !b.is_bye && !b.is_leg_bye && !b.is_wide) existing.fours += 1;
        if (b.runs_scored === 6 && !b.is_bye && !b.is_leg_bye && !b.is_wide) existing.sixes += 1;
        playerBatting.set(b.batter_id, existing);
      }
      if (b.bowler_id) {
        const existing = playerBowling.get(b.bowler_id) || { wickets: 0, runs: 0, legalBalls: 0 };
        existing.runs += b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0);
        if (b.is_wicket) existing.wickets += 1;
        if (!b.is_wide && !b.is_no_ball) existing.legalBalls += 1;
        playerBowling.set(b.bowler_id, existing);
      }
      if (b.is_wicket && b.dismissal_type === 'caught' && b.fielder_id) {
        playerCatches.set(b.fielder_id, (playerCatches.get(b.fielder_id) || 0) + 1);
      }
    });

    const getName = (pid: string) => allPlayers[pid]?.player_name || 'Unknown';
    const awards: { type: string; playerId: string; playerName: string; value: string }[] = [];

    let bestBatId = '', bestBatRuns = -1;
    playerBatting.forEach((v, k) => { if (v.runs > bestBatRuns) { bestBatRuns = v.runs; bestBatId = k; } });
    if (bestBatId) awards.push({ type: 'Best Batsman', playerId: bestBatId, playerName: getName(bestBatId), value: `${bestBatRuns} runs` });

    let bestBowlId = '', bestBowlW = -1;
    playerBowling.forEach((v, k) => { if (v.wickets > bestBowlW) { bestBowlW = v.wickets; bestBowlId = k; } });
    if (bestBowlId && bestBowlW > 0) awards.push({ type: 'Best Bowler', playerId: bestBowlId, playerName: getName(bestBowlId), value: `${bestBowlW} wickets` });

    let bestFieldId = '', bestCatches = 0;
    playerCatches.forEach((v, k) => { if (v > bestCatches) { bestCatches = v; bestFieldId = k; } });
    if (bestFieldId && bestCatches > 0) awards.push({ type: 'Best Fielder', playerId: bestFieldId, playerName: getName(bestFieldId), value: `${bestCatches} catches` });

    // Most Runs
    if (bestBatId) awards.push({ type: 'Most Runs', playerId: bestBatId, playerName: getName(bestBatId), value: `${bestBatRuns} runs` });

    // Most Sixes
    let mostSixId = '', mostSix = 0;
    playerBatting.forEach((v, k) => { if (v.sixes > mostSix) { mostSix = v.sixes; mostSixId = k; } });
    if (mostSixId && mostSix > 0) awards.push({ type: 'Most Sixes', playerId: mostSixId, playerName: getName(mostSixId), value: `${mostSix} sixes` });

    // Most Fours
    let mostFourId = '', mostFour = 0;
    playerBatting.forEach((v, k) => { if (v.fours > mostFour) { mostFour = v.fours; mostFourId = k; } });
    if (mostFourId && mostFour > 0) awards.push({ type: 'Most Fours', playerId: mostFourId, playerName: getName(mostFourId), value: `${mostFour} fours` });

    // POTM
    let potmId = '', potmScore = -1;
    const allPlayerIds = new Set([...playerBatting.keys(), ...playerBowling.keys()]);
    allPlayerIds.forEach(pid => {
      const bat = playerBatting.get(pid);
      const bowl = playerBowling.get(pid);
      const score = (bat?.runs || 0) + (bowl?.wickets || 0) * 25;
      if (score > potmScore) { potmScore = score; potmId = pid; }
    });
    if (potmId) awards.push({ type: 'Player of the Match', playerId: potmId, playerName: getName(potmId), value: '' });

    return awards;
  }, [innings, allBalls, allPlayers, match?.status]);

  // Realtime
  useEffect(() => {
    if (!id || match?.status !== 'live') return;
    const channel = supabase
      .channel(`match-detail-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innings', filter: `match_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['innings', id] });
        queryClient.invalidateQueries({ queryKey: ['match-balls', id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ball_by_ball' }, () => {
        queryClient.invalidateQueries({ queryKey: ['match-balls', id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['match', id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, match?.status, queryClient]);

  const startMatch = useMutation({
    mutationFn: async () => {
      if (!match || !user) throw new Error('Not authorized');
      let battingFirst = match.team_a_id;
      let bowlingFirst = match.team_b_id;
      if (tossWinner && tossDecision) {
        if (tossDecision === 'bat') {
          battingFirst = tossWinner;
          bowlingFirst = tossWinner === match.team_a_id ? match.team_b_id : match.team_a_id;
        } else {
          bowlingFirst = tossWinner;
          battingFirst = tossWinner === match.team_a_id ? match.team_b_id : match.team_a_id;
        }
      }
      await supabase.from('matches').update({
        status: 'live' as any, toss_winner_id: tossWinner || null, toss_decision: tossDecision || null,
      }).eq('id', id);
      if (!innings || innings.length === 0) {
        await supabase.from('innings').insert({
          match_id: id, batting_team_id: battingFirst, bowling_team_id: bowlingFirst, innings_number: 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      queryClient.invalidateQueries({ queryKey: ['innings', id] });
      navigate(`/match/${id}/score`);
    },
    onError: (error: Error) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const handleStartMatch = () => {
    if (teamAMembers && teamBMembers) {
      setSelectedSquadA(new Set(teamAMembers.map(m => m.id)));
      setSelectedSquadB(new Set(teamBMembers.map(m => m.id)));
      setSquadOpen(true);
    } else {
      startMatch.mutate();
    }
  };

  const confirmStartMatch = () => {
    if (!tossWinner) {
      toast({ title: 'Toss is mandatory', description: 'Please select the toss winner before starting the match.', variant: 'destructive' });
      return;
    }
    setSquadOpen(false);
    startMatch.mutate();
  };

  const deleteMatch = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('matches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({ title: 'Match deleted' });
      navigate('/matches');
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMatch = useMutation({
    mutationFn: async () => {
      const updateData: any = { name: editData.name.trim(), venue: editData.venue.trim() || null, overs: editData.overs };
      if (editData.match_date && editData.time) {
        const d = new Date(editData.match_date);
        const [h, m] = editData.time.split(':').map(Number);
        d.setHours(h, m, 0, 0);
        updateData.match_date = d.toISOString();
      }
      const { error } = await supabase.from('matches').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      toast({ title: 'Match updated' });
      setEditOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  // Helper to get overs as base-6 display (e.g. 3.4 means 3 overs 4 balls)
  const formatOvers = (legalBalls: number) => `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;

  const computeBattingCard = (inningsId: string) => {
    const balls = allBalls?.[inningsId] || [];
    const batters = new Map<string, { runs: number; balls: number; fours: number; sixes: number; isOut: boolean; dismissalType: string | null; bowlerId: string | null; fielderId: string | null }>();
    balls.forEach((b: any) => {
      if (!b.batter_id) return;
      const existing = batters.get(b.batter_id) || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, dismissalType: null, bowlerId: null, fielderId: null };
      if (!b.is_bye && !b.is_leg_bye) existing.runs += b.runs_scored;
      if (!b.is_wide) existing.balls += 1;
      if (b.runs_scored === 4 && !b.is_bye && !b.is_leg_bye && !b.is_wide) existing.fours += 1;
      if (b.runs_scored === 6 && !b.is_bye && !b.is_leg_bye && !b.is_wide) existing.sixes += 1;
      if (b.is_wicket && b.batter_id === (b.dismissed_player_id || b.batter_id)) {
        existing.isOut = true;
        existing.dismissalType = b.dismissal_type;
        existing.bowlerId = b.bowler_id || null;
        existing.fielderId = b.fielder_id || null;
      }
      batters.set(b.batter_id, existing);
    });
    return Array.from(batters.entries()).map(([id, stats]) => ({
      id, name: allPlayers?.[id]?.player_name || 'Unknown', playerId: allPlayers?.[id]?.user_id, ...stats,
      bowlerName: stats.bowlerId ? (allPlayers?.[stats.bowlerId]?.player_name || '') : '',
      fielderName: stats.fielderId ? (allPlayers?.[stats.fielderId]?.player_name || '') : '',
      sr: stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '-',
    }));
  };

  const computeBowlingCard = (inningsId: string) => {
    const balls = allBalls?.[inningsId] || [];
    const bowlers = new Map<string, { runs: number; wickets: number; legalBalls: number; wides: number; noBalls: number; dots: number }>();
    balls.forEach((b: any) => {
      if (!b.bowler_id) return;
      const existing = bowlers.get(b.bowler_id) || { runs: 0, wickets: 0, legalBalls: 0, wides: 0, noBalls: 0, dots: 0 };
      existing.runs += b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0);
      if (b.is_wicket) existing.wickets += 1;
      if (!b.is_wide && !b.is_no_ball) {
        existing.legalBalls += 1;
        if (b.runs_scored === 0 && !b.is_bye && !b.is_leg_bye) existing.dots += 1;
      }
      if (b.is_wide) existing.wides += 1;
      if (b.is_no_ball) existing.noBalls += 1;
      bowlers.set(b.bowler_id, existing);
    });
    return Array.from(bowlers.entries()).map(([id, stats]) => ({
      id, name: allPlayers?.[id]?.player_name || 'Unknown', playerId: allPlayers?.[id]?.user_id, ...stats,
      overs: formatOvers(stats.legalBalls),
      econ: stats.legalBalls > 0 ? (stats.runs / (stats.legalBalls / 6)).toFixed(2) : '-',
    }));
  };

  const computeInningsStats = (inningsId: string) => {
    const balls = allBalls?.[inningsId] || [];
    const legalBalls = balls.filter((b: any) => !b.is_wide && !b.is_no_ball).length;
    const totalRuns = balls.reduce((s: number, b: any) => s + b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0), 0);
    const crr = legalBalls > 0 ? (totalRuns / (legalBalls / 6)).toFixed(2) : '0.00';
    const fours = balls.filter((b: any) => b.runs_scored === 4 && !b.is_bye && !b.is_leg_bye && !b.is_wide).length;
    const sixes = balls.filter((b: any) => b.runs_scored === 6 && !b.is_bye && !b.is_leg_bye && !b.is_wide).length;
    return { legalBalls, totalRuns, crr, fours, sixes };
  };

  const computeOverSummary = (inningsId: string) => {
    const balls = allBalls?.[inningsId] || [];
    const overs: { over: number; balls: string[]; runs: number; wickets: number; bowlerName: string }[] = [];
    let legalCount = 0;
    let currentOverNum = -1;
    balls.forEach((b: any) => {
      const overNum = Math.floor(legalCount / 6);
      if (overNum !== currentOverNum) {
        currentOverNum = overNum;
        const bowlerName = b.bowler_id && allPlayers?.[b.bowler_id]?.player_name || '';
        overs.push({ over: overNum + 1, balls: [], runs: 0, wickets: 0, bowlerName });
      }
      const ov = overs[overs.length - 1];
      let label = `${b.runs_scored}`;
      if (b.is_wide) label = `Wd${b.runs_scored > 0 ? '+' + b.runs_scored : ''}`;
      else if (b.is_no_ball) label = `NB${b.runs_scored > 0 ? '+' + b.runs_scored : ''}`;
      else if (b.is_bye) label = `${b.runs_scored}B`;
      else if (b.is_leg_bye) label = `${b.runs_scored}LB`;
      if (b.is_wicket) label = 'W';
      ov.balls.push(label);
      ov.runs += b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0);
      if (b.is_wicket) ov.wickets += 1;
      if (!b.is_wide && !b.is_no_ball) legalCount += 1;
    });
    return overs;
  };

  if (isLoading || !match) {
    return (
      <MobileLayout showNav={false}>
        <PageHeader title="Match" showBack />
        <div className="p-4 space-y-4"><div className="h-40 rounded-2xl bg-secondary animate-pulse" /></div>
      </MobileLayout>
    );
  }

  const canScore = user && (user.id === match.scorer_id || user.id === match.created_by);
  const isCreator = user?.id === match.created_by;
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const resultSummary = (match as any).result_summary;

  const toggleSquad = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    setFn(next);
  };

  const ROLE_BADGES: Record<string, string> = { batsman: 'BAT', bowler: 'BOWL', allrounder: 'AR', wk_batsman: 'WK' };

  // Clickable player name helper
  const PlayerName: React.FC<{ name: string; playerId?: string; teamId?: string; className?: string }> = ({ name, playerId, teamId, className }) => {
    if (playerId) {
      return <Link to={`/profile/${playerId}`} className={`hover:underline text-primary font-medium ${className || ''}`}>{name}</Link>;
    }
    return <span className={className}>{name}</span>;
  };

  return (
    <MobileLayout showNav={false}>
      <PageHeader
        title={match.name}
        showBack
        rightAction={
          isCreator && !isCompleted ? (
            <Button variant="ghost" size="icon" onClick={() => {
              const d = new Date(match.match_date);
              setEditData({
                name: match.name, venue: match.venue || '', overs: match.overs,
                match_date: d.toISOString().split('T')[0],
                time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
              });
              setEditOpen(true);
            }}>
              <Settings className="w-5 h-5" />
            </Button>
          ) : undefined
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Match Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs opacity-75">
              <User className="w-3.5 h-3.5" />
              <span>by {isCreator ? 'You' : creatorProfile?.full_name || 'Unknown'}</span>
            </div>
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse" /> LIVE
              </span>
            ) : isCompleted ? (
              <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs font-semibold">COMPLETED</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs font-semibold">
                {format(new Date(match.match_date), 'MMM d, h:mm a')}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Link to={`/teams/${match.team_a?.id}`} className="text-center flex-1">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary-foreground/20 flex items-center justify-center text-2xl font-bold mb-2">
                {match.team_a?.logo_url ? <img src={match.team_a.logo_url} alt="" className="w-14 h-14 rounded-full object-cover" /> : match.team_a?.name?.charAt(0) || 'A'}
              </div>
              <div className="font-semibold">{match.team_a?.name || 'Team A'}</div>
              {innings && innings.find(i => i.batting_team_id === match.team_a_id) && (
                <div className="text-2xl font-bold mt-1">
                  {innings.find(i => i.batting_team_id === match.team_a_id)!.total_runs}/{innings.find(i => i.batting_team_id === match.team_a_id)!.total_wickets}
                  <span className="text-sm opacity-75 ml-1">({innings.find(i => i.batting_team_id === match.team_a_id)!.total_overs})</span>
                </div>
              )}
            </Link>
            <div className="text-2xl font-bold opacity-50">VS</div>
            <Link to={`/teams/${match.team_b?.id}`} className="text-center flex-1">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary-foreground/20 flex items-center justify-center text-2xl font-bold mb-2">
                {match.team_b?.logo_url ? <img src={match.team_b.logo_url} alt="" className="w-14 h-14 rounded-full object-cover" /> : match.team_b?.name?.charAt(0) || 'B'}
              </div>
              <div className="font-semibold">{match.team_b?.name || 'Team B'}</div>
              {innings && innings.find(i => i.batting_team_id === match.team_b_id) && (
                <div className="text-2xl font-bold mt-1">
                  {innings.find(i => i.batting_team_id === match.team_b_id)!.total_runs}/{innings.find(i => i.batting_team_id === match.team_b_id)!.total_wickets}
                  <span className="text-sm opacity-75 ml-1">({innings.find(i => i.batting_team_id === match.team_b_id)!.total_overs})</span>
                </div>
              )}
            </Link>
          </div>

          {match.toss_winner_id && (
            <p className="text-center text-xs opacity-80 mt-2">
              Toss: {match.toss_winner_id === match.team_a?.id ? match.team_a?.name : match.team_b?.name} chose to {match.toss_decision || 'bat'}
            </p>
          )}

          {isCompleted && resultSummary && (
            <div className="text-center mt-3 bg-primary-foreground/20 rounded-lg py-2 px-3 text-sm font-semibold">
              🏆 {resultSummary}
            </div>
          )}
          {!isCompleted && innings && innings.length === 2 && innings[0].is_completed && (
            <div className="text-center mt-3 text-sm opacity-90">
              Target: {innings[0].total_runs + 1} • Need {Math.max(0, innings[0].total_runs + 1 - innings[1].total_runs)} runs
            </div>
          )}

          <div className="flex justify-center gap-4 mt-4 text-sm opacity-75">
            <span>{match.overs === 0 ? 'Unlimited overs' : `${match.overs} overs`}</span>
            {match.venue && <span>• {match.venue}</span>}
          </div>
        </motion.div>

        {/* Actions */}
        {canScore && !isCompleted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {isLive ? (
              <Button onClick={() => navigate(`/match/${id}/score`)} className="w-full h-14 text-lg">
                <Play className="w-5 h-5 mr-2" /> Continue Scoring
              </Button>
            ) : (
              <Button onClick={handleStartMatch} className="w-full h-14 text-lg" disabled={startMatch.isPending}>
                <Play className="w-5 h-5 mr-2" /> {startMatch.isPending ? 'Starting...' : 'Start Match'}
              </Button>
            )}
          </motion.div>
        )}

        {isCreator && (
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Match
          </Button>
        )}

        {/* Auto Awards */}
        {isCompleted && autoAwards.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-amber-500" /> Awards</h3>
            <div className="space-y-2">
              {autoAwards.map((a, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{a.type}</span>
                  <span className="font-medium">{a.playerName} {a.value && <span className="text-xs text-muted-foreground">({a.value})</span>}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="scorecard" className="mt-4">
          <TabsList className="w-full grid grid-cols-3 h-12 rounded-xl">
            <TabsTrigger value="scorecard" className="rounded-lg"><FileText className="w-4 h-4 mr-1.5" />Scorecard</TabsTrigger>
            <TabsTrigger value="overs" className="rounded-lg">Overs</TabsTrigger>
            <TabsTrigger value="info" className="rounded-lg">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="scorecard" className="mt-4 space-y-3">
            {innings && innings.length > 0 ? (
              innings.map((inn: any, idx: number) => {
                const battingCard = computeBattingCard(inn.id);
                const bowlingCard = computeBowlingCard(inn.id);
                const stats = computeInningsStats(inn.id);
                const battingTeamName = inn.batting_team_id === match.team_a?.id ? match.team_a?.name : match.team_b?.name;

                return (
                  <Collapsible key={inn.id} defaultOpen={true}>
                    <div className="bg-card rounded-xl border border-border p-4">
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <h3 className="font-semibold">{battingTeamName || `Innings ${idx + 1}`}</h3>
                        <div className="flex items-center gap-2">
                          {inn.is_completed && <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Completed</span>}
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CollapsibleTrigger>
                      <div className="text-3xl font-bold">
                        {inn.total_runs}/{inn.total_wickets}
                        <span className="text-lg text-muted-foreground ml-2">({inn.total_overs} ov)</span>
                      </div>
                      {/* CRR & extras summary */}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span>CRR: <b className="text-foreground">{stats.crr}</b></span>
                        <span>4s: <b className="text-foreground">{stats.fours}</b></span>
                        <span>6s: <b className="text-foreground">{stats.sixes}</b></span>
                      </div>
                      {(inn.extras_wides + inn.extras_no_balls + inn.extras_byes + inn.extras_leg_byes) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Extras: <b className="text-foreground">{inn.extras_wides + inn.extras_no_balls + inn.extras_byes + inn.extras_leg_byes}</b>
                          {' '}(w {inn.extras_wides}, nb {inn.extras_no_balls}, b {inn.extras_byes}, lb {inn.extras_leg_byes})
                        </p>
                      )}
                    </div>

                    <CollapsibleContent className="space-y-3 mt-3">
                    {battingCard.length > 0 && (
                      <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-2 border-b border-border bg-secondary/30">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Batting</p>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border">
                              <th className="px-3 py-2 text-left">Batter</th>
                              <th className="px-2 py-2 text-center">R</th>
                              <th className="px-2 py-2 text-center">B</th>
                              <th className="px-2 py-2 text-center">4s</th>
                              <th className="px-2 py-2 text-center">6s</th>
                              <th className="px-2 py-2 text-center">SR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {battingCard.map((b) => (
                              <tr key={b.id} className="border-b border-border/50 last:border-0">
                                <td className="px-3 py-2 font-medium max-w-[140px]">
                                  <PlayerName name={b.name} playerId={b.playerId} />
                                  {!b.isOut && <span className="text-green-500 ml-1">*</span>}
                                  {b.isOut && (
                                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                                      {b.dismissalType === 'caught' && b.fielderName
                                        ? `c ${b.fielderName} b ${b.bowlerName}`
                                        : b.dismissalType === 'bowled'
                                        ? `b ${b.bowlerName}`
                                        : b.dismissalType === 'lbw'
                                        ? `lbw b ${b.bowlerName}`
                                        : b.dismissalType === 'run_out'
                                        ? `run out${b.fielderName ? ` (${b.fielderName})` : ''}`
                                        : b.dismissalType === 'stumped' && b.fielderName
                                        ? `st ${b.fielderName} b ${b.bowlerName}`
                                        : b.dismissalType || 'out'}
                                    </div>
                                  )}
                                </td>
                                <td className="px-2 py-2 text-center font-bold">{b.runs}</td>
                                <td className="px-2 py-2 text-center">{b.balls}</td>
                                <td className="px-2 py-2 text-center">{b.fours}</td>
                                <td className="px-2 py-2 text-center">{b.sixes}</td>
                                <td className="px-2 py-2 text-center text-muted-foreground">{b.sr}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {bowlingCard.length > 0 && (
                      <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="px-4 py-2 border-b border-border bg-secondary/30">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Bowling</p>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border">
                              <th className="px-3 py-2 text-left">Bowler</th>
                              <th className="px-2 py-2 text-center">O</th>
                              <th className="px-2 py-2 text-center">R</th>
                              <th className="px-2 py-2 text-center">W</th>
                              <th className="px-2 py-2 text-center">Econ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bowlingCard.map((b) => (
                              <tr key={b.id} className="border-b border-border/50 last:border-0">
                                <td className="px-3 py-2 font-medium truncate max-w-[100px]">
                                  <PlayerName name={b.name} playerId={b.playerId} />
                                </td>
                                <td className="px-2 py-2 text-center">{b.overs}</td>
                                <td className="px-2 py-2 text-center">{b.runs}</td>
                                <td className="px-2 py-2 text-center font-bold">{b.wickets}</td>
                                <td className="px-2 py-2 text-center text-muted-foreground">{b.econ}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">No scorecard available yet</div>
            )}
          </TabsContent>

          <TabsContent value="overs" className="mt-4 space-y-4">
            {innings && innings.length > 0 ? (
              innings.map((inn: any) => {
                const overSummary = computeOverSummary(inn.id);
                const teamName = inn.batting_team_id === match.team_a?.id ? match.team_a?.name : match.team_b?.name;
                return (
                  <div key={inn.id} className="bg-card rounded-xl border border-border p-4">
                    <h3 className="font-semibold text-sm mb-3">{teamName} - Over by Over</h3>
                    {overSummary.length > 0 ? (
                      <div className="space-y-2">
                        {overSummary.map(o => (
                          <div key={o.over} className="flex items-center gap-3 text-xs">
                            <span className="w-10 text-muted-foreground font-medium">Ov {o.over}</span>
                            {o.bowlerName && <span className="w-16 truncate text-muted-foreground text-[10px]">{o.bowlerName}</span>}
                            <div className="flex gap-1 flex-1 flex-wrap">
                              {o.balls.map((b, i) => (
                                <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  b === 'W' ? 'bg-destructive/20 text-destructive' :
                                  b.includes('Wd') || b.includes('NB') ? 'bg-amber-500/20 text-amber-600' :
                                  b === '4' || b === '6' ? 'bg-green-500/20 text-green-600' :
                                  'bg-secondary text-muted-foreground'
                                }`}>
                                  {b}
                                </span>
                              ))}
                            </div>
                            <span className="font-bold text-sm">{o.runs}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No balls bowled yet</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">No overs data yet</div>
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium">{match.overs === 0 ? 'Test (unlimited)' : `${match.overs} overs`}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{format(new Date(match.match_date), 'MMMM d, yyyy')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{format(new Date(match.match_date), 'h:mm a')}</span></div>
              {match.venue && <div className="flex justify-between"><span className="text-muted-foreground">Venue</span><span className="font-medium">{match.venue}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Created by</span><span className="font-medium">{isCreator ? 'You' : creatorProfile?.full_name || 'Unknown'}</span></div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Squad Selection Dialog */}
      <Dialog open={squadOpen} onOpenChange={setSquadOpen}>
        <DialogContent className="bg-card max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Select Playing XI</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-xl p-3 space-y-3">
              <h4 className="font-semibold text-sm">Toss</h4>
              <div className="space-y-2">
                <Label className="text-xs">Toss Winner</Label>
                <Select value={tossWinner} onValueChange={setTossWinner}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select toss winner" /></SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {match.team_a?.id && <SelectItem value={match.team_a.id}>{match.team_a.name}</SelectItem>}
                    {match.team_b?.id && <SelectItem value={match.team_b.id}>{match.team_b.name}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              {tossWinner && (
                <div className="space-y-2">
                  <Label className="text-xs">Chose to</Label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setTossDecision('bat')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tossDecision === 'bat' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>🏏 Bat</button>
                    <button type="button" onClick={() => setTossDecision('bowl')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tossDecision === 'bowl' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>🎳 Bowl</button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">{match.team_a?.name} ({selectedSquadA.size} selected)</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(teamAMembers || []).map((m: any) => (
                  <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer">
                    <Checkbox checked={selectedSquadA.has(m.id)} onCheckedChange={() => toggleSquad(selectedSquadA, setSelectedSquadA, m.id)} />
                    <span className="text-sm flex-1">{m.player_name}</span>
                    {m.playing_role && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{ROLE_BADGES[m.playing_role] || m.playing_role}</span>}
                    {m.is_captain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600">C</span>}
                    {m.is_wicket_keeper && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">WK</span>}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">{match.team_b?.name} ({selectedSquadB.size} selected)</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(teamBMembers || []).map((m: any) => (
                  <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary cursor-pointer">
                    <Checkbox checked={selectedSquadB.has(m.id)} onCheckedChange={() => toggleSquad(selectedSquadB, setSelectedSquadB, m.id)} />
                    <span className="text-sm flex-1">{m.player_name}</span>
                    {m.playing_role && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{ROLE_BADGES[m.playing_role] || m.playing_role}</span>}
                    {m.is_captain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600">C</span>}
                    {m.is_wicket_keeper && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">WK</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSquadOpen(false)}>Cancel</Button>
            <Button onClick={confirmStartMatch} disabled={startMatch.isPending}>
              {startMatch.isPending ? 'Starting...' : 'Start Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => deleteMatch.mutate()} title="Delete Match" description={`Delete "${match.name}"? All scoring data will be lost.`} loading={deleteMatch.isPending} />

      <EditModal open={editOpen} onClose={() => setEditOpen(false)} onSave={() => updateMatch.mutate()} title="Edit Match" loading={updateMatch.isPending}>
        <div className="space-y-2"><Label>Match Name</Label><Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} /></div>
        <div className="space-y-2"><Label>Venue</Label><Input value={editData.venue} onChange={(e) => setEditData({ ...editData, venue: e.target.value })} /></div>
        <div className="space-y-2"><Label>Overs (0 = unlimited)</Label><Input type="number" min={0} max={500} value={editData.overs} onChange={(e) => setEditData({ ...editData, overs: Number(e.target.value) || 0 })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Date</Label><Input type="date" value={editData.match_date} onChange={(e) => setEditData({ ...editData, match_date: e.target.value })} /></div>
          <div className="space-y-2"><Label>Time</Label><Input type="time" value={editData.time} onChange={(e) => setEditData({ ...editData, time: e.target.value })} /></div>
        </div>
      </EditModal>
    </MobileLayout>
  );
};

export default MatchDetailPage;
