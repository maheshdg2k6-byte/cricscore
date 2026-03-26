import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Flag, Wifi, WifiOff } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import LiveScoreHeader from '@/components/match/LiveScoreHeader';
import ScoringPanel from '@/components/scoring/ScoringPanel';
import ThisOver from '@/components/scoring/ThisOver';
import PlayerSelector from '@/components/scoring/PlayerSelector';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface Ball {
  id: string;
  runs: number;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isWicket: boolean;
}

const ScoringPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEndInningsDialog, setShowEndInningsDialog] = useState(false);
  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [bowlerId, setBowlerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showNextBatsman, setShowNextBatsman] = useState(false);
  const [showNextBowler, setShowNextBowler] = useState(false);
  const [matchWon, setMatchWon] = useState(false);
  const [wonMessage, setWonMessage] = useState('');

  const { data: match } = useQuery({
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

  const { data: allInnings } = useQuery({
    queryKey: ['allInnings', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('innings').select('*').eq('match_id', id!).order('innings_number');
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: currentInnings, refetch: refetchInnings } = useQuery({
    queryKey: ['currentInnings', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('innings').select('*').eq('match_id', id!).eq('is_completed', false)
        .order('innings_number', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchInterval: 3000,
  });

  const { data: ballsRaw, refetch: refetchBalls } = useQuery({
    queryKey: ['balls', currentInnings?.id],
    queryFn: async () => {
      if (!currentInnings?.id) return [];
      const { data, error } = await supabase
        .from('ball_by_ball').select('*').eq('innings_id', currentInnings.id)
        .order('over_number', { ascending: true }).order('ball_number', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentInnings?.id,
    refetchInterval: 3000,
  });

  const { data: battingPlayers } = useQuery({
    queryKey: ['battingPlayers', currentInnings?.batting_team_id],
    queryFn: async () => {
      if (!currentInnings?.batting_team_id) return [];
      const { data, error } = await supabase.from('team_members').select('*').eq('team_id', currentInnings.batting_team_id).order('player_name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentInnings?.batting_team_id,
  });

  const { data: bowlingPlayers } = useQuery({
    queryKey: ['bowlingPlayers', currentInnings?.bowling_team_id],
    queryFn: async () => {
      if (!currentInnings?.bowling_team_id) return [];
      const { data, error } = await supabase.from('team_members').select('*').eq('team_id', currentInnings.bowling_team_id).order('player_name');
      if (error) throw error;
      return data;
    },
    enabled: !!currentInnings?.bowling_team_id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`scoring-live-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'innings', filter: `match_id=eq.${id}` }, () => {
        refetchInnings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ball_by_ball' }, () => {
        refetchBalls();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['match', id] });
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    return () => { supabase.removeChannel(channel); };
  }, [id, refetchInnings, refetchBalls, queryClient]);

  const balls: Ball[] = (ballsRaw || []).map((b: any) => ({
    id: b.id, runs: b.runs_scored, isWide: b.is_wide, isNoBall: b.is_no_ball,
    isBye: b.is_bye, isLegBye: b.is_leg_bye, isWicket: b.is_wicket,
  }));

  const legalBallCount = balls.filter(b => !b.isWide && !b.isNoBall).length;
  const currentOver = Math.floor(legalBallCount / 6);
  const currentBallInOver = legalBallCount % 6;

  const thisOverBalls = balls.filter((_, i) => {
    const legalBallsBefore = balls.slice(0, i).filter(b => !b.isWide && !b.isNoBall).length;
    return Math.floor(legalBallsBefore / 6) === currentOver;
  });

  // Previous overs summary
  const previousOvers: { over: number; runs: number; wickets: number }[] = [];
  for (let o = 0; o < currentOver; o++) {
    const overBalls = balls.filter((_, i) => {
      const legalBefore = balls.slice(0, i).filter(b => !b.isWide && !b.isNoBall).length;
      return Math.floor(legalBefore / 6) === o;
    });
    previousOvers.push({
      over: o + 1,
      runs: overBalls.reduce((s, b) => s + b.runs + (b.isWide || b.isNoBall ? 1 : 0), 0),
      wickets: overBalls.filter(b => b.isWicket).length,
    });
  }

  const strikerBalls = ballsRaw?.filter((b: any) => b.batter_id === strikerId) || [];
  const strikerRuns = strikerBalls.reduce((sum: number, b: any) => sum + (b.is_bye || b.is_leg_bye ? 0 : b.runs_scored), 0);
  const strikerBallsFaced = strikerBalls.filter((b: any) => !b.is_wide).length;

  const nonStrikerBalls = ballsRaw?.filter((b: any) => b.batter_id === nonStrikerId) || [];
  const nonStrikerRuns = nonStrikerBalls.reduce((sum: number, b: any) => sum + (b.is_bye || b.is_leg_bye ? 0 : b.runs_scored), 0);
  const nonStrikerBallsFaced = nonStrikerBalls.filter((b: any) => !b.is_wide).length;

  const bowlerBalls = ballsRaw?.filter((b: any) => b.bowler_id === bowlerId) || [];
  const bowlerRunsConceded = bowlerBalls.reduce((sum: number, b: any) => sum + b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0), 0);
  const bowlerWickets = bowlerBalls.filter((b: any) => b.is_wicket).length;
  const bowlerLegalBalls = bowlerBalls.filter((b: any) => !b.is_wide && !b.is_no_ball).length;
  const bowlerOversDisplay = `${Math.floor(bowlerLegalBalls / 6)}.${bowlerLegalBalls % 6}`;

  // Target chase info for 2nd innings
  const firstInnings = allInnings?.find(i => i.innings_number === 1);
  const target = firstInnings && currentInnings?.innings_number === 2 ? firstInnings.total_runs + 1 : null;
  const runsNeeded = target && currentInnings ? Math.max(0, target - currentInnings.total_runs) : null;
  const totalBallsInMatch = match?.overs ? match.overs * 6 : null;
  const ballsRemaining = totalBallsInMatch ? Math.max(0, totalBallsInMatch - legalBallCount) : null;
  const currentRunRate = legalBallCount > 0 && currentInnings ? ((currentInnings.total_runs / legalBallCount) * 6).toFixed(2) : '-';
  const requiredRunRate = runsNeeded && ballsRemaining && ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : null;

  const getTeamName = (teamId: string | null) => {
    if (!match || !teamId) return 'Unknown';
    if (teamId === match.team_a?.id) return match.team_a?.name || 'Team A';
    if (teamId === match.team_b?.id) return match.team_b?.name || 'Team B';
    return 'Unknown';
  };

  const doEndInnings = async () => {
    if (!currentInnings || !match) throw new Error('No innings');
    
    // Recalculate totals from actual balls to avoid stale state issues
    const { data: freshBalls } = await supabase.from('ball_by_ball').select('*').eq('innings_id', currentInnings.id);
    const actualTotalRuns = (freshBalls || []).reduce((s: number, b: any) => s + b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0), 0);
    const actualTotalWickets = (freshBalls || []).filter((b: any) => b.is_wicket).length;
    const actualLegalBalls = (freshBalls || []).filter((b: any) => !b.is_wide && !b.is_no_ball).length;
    const actualTotalOvers = Math.floor(actualLegalBalls / 6) + (actualLegalBalls % 6) / 10;
    
    // Update innings with accurate totals before completing
    const { error: completeError } = await supabase.from('innings').update({ 
      is_completed: true,
      total_runs: actualTotalRuns,
      total_wickets: actualTotalWickets,
      total_overs: actualTotalOvers,
    }).eq('id', currentInnings.id);
    if (completeError) throw completeError;

    if (currentInnings.innings_number === 1) {
      const { error: newInningsError } = await supabase.from('innings').insert({
        match_id: id, batting_team_id: currentInnings.bowling_team_id, bowling_team_id: currentInnings.batting_team_id, innings_number: 2,
      });
      if (newInningsError) throw newInningsError;
    } else {
      // Get fresh 1st innings data
      const { data: firstInnData } = await supabase.from('innings').select('*').eq('match_id', id!).eq('innings_number', 1).single();
      const firstInn = firstInnData;
      
      let winnerId: string | null = null;
      let resultSummary = '';
      if (firstInn) {
        const firstBattingTeamName = getTeamName(firstInn.batting_team_id);
        const secondBattingTeamName = getTeamName(currentInnings.batting_team_id);
        
        // 2nd innings batting team (chasing team) scored MORE → they win by wickets
        if (actualTotalRuns > firstInn.total_runs) {
          winnerId = currentInnings.batting_team_id;
          const wicketsLeft = 10 - actualTotalWickets;
          resultSummary = `${secondBattingTeamName} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
        } 
        // 2nd innings batting team scored LESS → 1st batting team wins by runs
        else if (actualTotalRuns < firstInn.total_runs) {
          winnerId = firstInn.batting_team_id;
          const runMargin = firstInn.total_runs - actualTotalRuns;
          resultSummary = `${firstBattingTeamName} won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`;
        } 
        // Equal → Tie
        else {
          resultSummary = 'Match Tied';
        }
      }
      await supabase.from('matches').update({
        status: 'completed' as any, winner_team_id: winnerId, result_summary: resultSummary,
      }).eq('id', id);
      return resultSummary;
    }
    return null;
  };

  const deliverBall = useMutation({
    mutationFn: async (data: {
      runs: number; isWide: boolean; isNoBall: boolean; isBye: boolean; isLegBye: boolean; isWicket: boolean; dismissalType?: string; fielderId?: string;
    }) => {
      if (!currentInnings || !user) throw new Error('Not authorized');

      const overNumber = Math.floor(legalBallCount / 6);
      const ballNumber = legalBallCount % 6 + 1;

      const { error: ballError } = await supabase.from('ball_by_ball').insert([{
        innings_id: currentInnings.id,
        over_number: overNumber,
        ball_number: data.isWide || data.isNoBall ? 0 : ballNumber,
        runs_scored: data.runs,
        is_wide: data.isWide,
        is_no_ball: data.isNoBall,
        is_bye: data.isBye,
        is_leg_bye: data.isLegBye,
        is_wicket: data.isWicket,
        batter_id: strikerId,
        bowler_id: bowlerId,
        dismissal_type: data.dismissalType as any,
        fielder_id: data.fielderId || null,
      }]);
      if (ballError) throw ballError;

      const totalRuns = (currentInnings.total_runs || 0) + data.runs + (data.isWide || data.isNoBall ? 1 : 0);
      const totalWickets = (currentInnings.total_wickets || 0) + (data.isWicket ? 1 : 0);
      const newLegalBalls = legalBallCount + (data.isWide || data.isNoBall ? 0 : 1);
      const totalOvers = Math.floor(newLegalBalls / 6) + (newLegalBalls % 6) / 10;

      const { error: inningsError } = await supabase.from('innings').update({
        total_runs: totalRuns,
        total_wickets: totalWickets,
        total_overs: totalOvers,
        extras_wides: (currentInnings.extras_wides || 0) + (data.isWide ? 1 + data.runs : 0),
        extras_no_balls: (currentInnings.extras_no_balls || 0) + (data.isNoBall ? 1 + data.runs : 0),
        extras_byes: (currentInnings.extras_byes || 0) + (data.isBye ? data.runs : 0),
        extras_leg_byes: (currentInnings.extras_leg_byes || 0) + (data.isLegBye ? data.runs : 0),
      }).eq('id', currentInnings.id);
      if (inningsError) throw inningsError;

      // Swap striker on odd runs (not on wide/no-ball without runs)
      if (data.runs % 2 === 1 && !data.isWide) {
        const temp = strikerId;
        setStrikerId(nonStrikerId);
        setNonStrikerId(temp);
      }

      // Check target chased in 2nd innings
      if (target && totalRuns >= target) {
        const msg = await doEndInnings();
        return { type: 'match_won', message: msg };
      }

      // All out
      if (totalWickets >= 10) {
        const msg = await doEndInnings();
        if (currentInnings.innings_number === 2) {
          return { type: 'match_won', message: msg };
        }
        return { type: 'innings_ended' };
      }

      // Check if wicket fell - prompt next batsman
      if (data.isWicket) {
        return { type: 'wicket' };
      }

      // Auto-switch innings when overs complete
      if (match && match.overs > 0 && newLegalBalls >= match.overs * 6) {
        const msg = await doEndInnings();
        if (currentInnings.innings_number === 2) {
          return { type: 'match_won', message: msg };
        }
        return { type: 'innings_ended' };
      }

      // Check end of over - prompt new bowler
      if (!data.isWide && !data.isNoBall && newLegalBalls % 6 === 0) {
        // On over end, non-striker comes to strike UNLESS last ball had odd runs
        // (odd runs already swapped them mid-ball, so striker is already at non-striker end)
        return { type: 'over_ended', lastBallOddRuns: data.runs % 2 === 1 };
      }

      return { type: 'ok' };
    },
    onSuccess: (result) => {
      refetchInnings();
      refetchBalls();
      queryClient.invalidateQueries({ queryKey: ['allInnings', id] });

      if (result.type === 'match_won') {
        setStrikerId(null); setNonStrikerId(null); setBowlerId(null);
        setWonMessage(result.message || 'Match completed!');
        setMatchWon(true);
        queryClient.invalidateQueries({ queryKey: ['match', id] });
        queryClient.invalidateQueries({ queryKey: ['currentInnings', id] });
      } else if (result.type === 'innings_ended') {
        setStrikerId(null); setNonStrikerId(null); setBowlerId(null);
        queryClient.invalidateQueries({ queryKey: ['match', id] });
        queryClient.invalidateQueries({ queryKey: ['currentInnings', id] });
        toast({ title: 'Overs complete! Starting 2nd innings.' });
      } else if (result.type === 'wicket') {
        setStrikerId(null);
        setShowNextBatsman(true);
      } else if (result.type === 'over_ended') {
        // Only swap if last ball had even runs (odd runs already swapped striker)
        if (!result.lastBallOddRuns) {
          const temp = strikerId;
          setStrikerId(nonStrikerId);
          setNonStrikerId(temp);
        }
        setBowlerId(null);
        setShowNextBowler(true);
        toast({ title: 'Over completed', description: 'Select next bowler.' });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const undoLastBall = useMutation({
    mutationFn: async () => {
      if (!ballsRaw || ballsRaw.length === 0 || !currentInnings) return;
      const lastBall = ballsRaw[ballsRaw.length - 1];
      const { error: deleteError } = await supabase.from('ball_by_ball').delete().eq('id', lastBall.id);
      if (deleteError) throw deleteError;

      const remaining = ballsRaw.slice(0, -1);
      const totalRuns = remaining.reduce((sum: number, b: any) => sum + b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0), 0);
      const totalWickets = remaining.filter((b: any) => b.is_wicket).length;
      const legal = remaining.filter((b: any) => !b.is_wide && !b.is_no_ball).length;
      const totalOvers = Math.floor(legal / 6) + (legal % 6) / 10;

      const extras_wides = remaining.reduce((s: number, b: any) => s + (b.is_wide ? 1 + b.runs_scored : 0), 0);
      const extras_no_balls = remaining.reduce((s: number, b: any) => s + (b.is_no_ball ? 1 + b.runs_scored : 0), 0);
      const extras_byes = remaining.reduce((s: number, b: any) => s + (b.is_bye ? b.runs_scored : 0), 0);
      const extras_leg_byes = remaining.reduce((s: number, b: any) => s + (b.is_leg_bye ? b.runs_scored : 0), 0);

      await supabase.from('innings').update({
        total_runs: totalRuns, total_wickets: totalWickets, total_overs: totalOvers,
        extras_wides, extras_no_balls, extras_byes, extras_leg_byes,
      }).eq('id', currentInnings.id);
    },
    onSuccess: () => {
      refetchInnings();
      refetchBalls();
      toast({ title: 'Ball undone' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const endInnings = useMutation({
    mutationFn: doEndInnings,
    onSuccess: (result) => {
      setShowEndInningsDialog(false);
      setStrikerId(null); setNonStrikerId(null); setBowlerId(null);
      queryClient.invalidateQueries({ queryKey: ['match', id] });
      queryClient.invalidateQueries({ queryKey: ['currentInnings', id] });
      queryClient.invalidateQueries({ queryKey: ['allInnings', id] });
      if (currentInnings?.innings_number === 2) {
        setWonMessage(result || 'Match completed!');
        setMatchWon(true);
      } else {
        toast({ title: 'Innings ended. Starting 2nd innings.' });
      }
    },
  });

  const handleEndOver = () => {
    // Manual end-over: non-striker comes to strike (swap)
    const temp = strikerId;
    setStrikerId(nonStrikerId);
    setNonStrikerId(temp);
    setBowlerId(null);
    setShowNextBowler(true);
    toast({ title: 'Over ended', description: 'Select next bowler.' });
  };

  // Dismissed batters in this innings
  const dismissedBatterIds = new Set(
    (ballsRaw || []).filter((b: any) => b.is_wicket && b.batter_id).map((b: any) => b.batter_id)
  );
  const availableBatters = (battingPlayers || []).filter(
    p => !dismissedBatterIds.has(p.id) && p.id !== nonStrikerId && p.id !== strikerId
  );

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading match...</p>
        </motion.div>
      </div>
    );
  }

  // If match is completed (after last innings ends), show result immediately - no buffering
  if (match.status === 'completed' && !currentInnings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
          <div className="text-4xl">🏆</div>
          <h2 className="text-xl font-bold">{(match as any).result_summary || 'Match Completed!'}</h2>
          <Button onClick={() => navigate(`/match/${id}`)} className="w-full">View Scorecard</Button>
        </motion.div>
      </div>
    );
  }

  if (!currentInnings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Setting up innings...</p>
        </motion.div>
      </div>
    );
  }

  const battingTeam = currentInnings.batting_team_id === match.team_a?.id ? match.team_a : match.team_b;
  const bowlingTeamObj = currentInnings.bowling_team_id === match.team_a?.id ? match.team_a : match.team_b;

  return (
    <div className="min-h-screen bg-background pb-safe">
      <PageHeader
        title={match.name}
        showBack
        showSidebar
        rightAction={
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
            <Button variant="ghost" size="icon" onClick={() => setShowEndInningsDialog(true)} className="rounded-xl">
              <Flag className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        <LiveScoreHeader
          battingTeam={battingTeam?.name || 'Batting'}
          bowlingTeam={bowlingTeamObj?.name || 'Bowling'}
          runs={currentInnings.total_runs || 0}
          wickets={currentInnings.total_wickets || 0}
          overs={currentOver}
          balls={currentBallInOver}
          currentBatter={battingPlayers?.find(p => p.id === strikerId)?.player_name || 'Select Striker'}
          currentBatterRuns={strikerRuns}
          currentBatterBalls={strikerBallsFaced}
          currentBowler={bowlingPlayers?.find(p => p.id === bowlerId)?.player_name || 'Select Bowler'}
          currentBowlerOvers={bowlerOversDisplay}
          currentBowlerRuns={bowlerRunsConceded}
          currentBowlerWickets={bowlerWickets}
          isRealtime={isConnected}
        />

        {/* Target chase info */}
        {target && (
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-sm">
            <div className="flex justify-between">
              <span>Target: <b>{target}</b></span>
              <span>Need: <b>{runsNeeded}</b> off <b>{ballsRemaining ?? '?'}</b> balls</span>
            </div>
            <div className="flex justify-between mt-1 text-muted-foreground text-xs">
              <span>CRR: {currentRunRate}</span>
              {requiredRunRate && <span>RRR: {requiredRunRate}</span>}
            </div>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
          <PlayerSelector label="Striker" players={battingPlayers || []} selectedId={strikerId} onSelect={setStrikerId} />
          <PlayerSelector label="Non-Striker" players={battingPlayers || []} selectedId={nonStrikerId} onSelect={setNonStrikerId} />
          <PlayerSelector label="Bowler" players={bowlingPlayers || []} selectedId={bowlerId} onSelect={setBowlerId} />
        </motion.div>

        {/* Non-striker info */}
        {nonStrikerId && (
          <div className="flex items-center justify-between bg-card rounded-lg border border-border px-3 py-2 text-xs">
            <span className="text-muted-foreground">Non-Striker: <b className="text-foreground">{battingPlayers?.find(p => p.id === nonStrikerId)?.player_name}</b></span>
            <span>{nonStrikerRuns} ({nonStrikerBallsFaced})</span>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ThisOver balls={thisOverBalls} overNumber={currentOver} />
        </motion.div>

        {/* Previous Overs */}
        {previousOvers.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {previousOvers.map(o => (
              <div key={o.over} className="flex-shrink-0 bg-secondary rounded-lg px-3 py-1.5 text-xs text-center">
                <div className="text-muted-foreground">Ov {o.over}</div>
                <div className="font-bold">{o.runs}{o.wickets > 0 && <span className="text-destructive">/{o.wickets}w</span>}</div>
              </div>
            ))}
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ScoringPanel
            onDeliverBall={(data) => deliverBall.mutate(data)}
            onUndo={() => undoLastBall.mutate()}
            onEndOver={handleEndOver}
            disabled={deliverBall.isPending || !strikerId || !bowlerId || matchWon}
            fieldingPlayers={bowlingPlayers || []}
          />
        </motion.div>
      </div>

      {/* End Innings Dialog */}
      <Dialog open={showEndInningsDialog} onOpenChange={setShowEndInningsDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>End Innings?</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">
            {battingTeam?.name}: {currentInnings.total_runs}/{currentInnings.total_wickets} ({currentOver}.{currentBallInOver} ov)
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEndInningsDialog(false)}>Cancel</Button>
            <Button onClick={() => endInnings.mutate()} disabled={endInnings.isPending} className="bg-gradient-to-r from-primary to-accent">End Innings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Match Won Dialog */}
      <Dialog open={matchWon} onOpenChange={() => {}}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>🏆 Match Completed!</DialogTitle></DialogHeader>
          <p className="text-center text-lg font-semibold">{wonMessage}</p>
          <DialogFooter>
            <Button onClick={() => navigate(`/match/${id}`)} className="w-full">View Scorecard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Next Batsman Dialog */}
      <Dialog open={showNextBatsman} onOpenChange={setShowNextBatsman}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>🏏 Wicket! Select Next Batsman</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Next Batsman</Label>
            <Select onValueChange={(v) => { setStrikerId(v); setShowNextBatsman(false); }}>
              <SelectTrigger><SelectValue placeholder="Select batsman" /></SelectTrigger>
              <SelectContent className="bg-card z-50">
                {availableBatters.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.player_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Next Bowler Dialog */}
      <Dialog open={showNextBowler} onOpenChange={setShowNextBowler}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>🏐 Over Complete! Select Next Bowler</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Next Bowler</Label>
            <Select onValueChange={(v) => { setBowlerId(v); setShowNextBowler(false); }}>
              <SelectTrigger><SelectValue placeholder="Select bowler" /></SelectTrigger>
              <SelectContent className="bg-card z-50">
                {(bowlingPlayers || []).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.player_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScoringPage;
