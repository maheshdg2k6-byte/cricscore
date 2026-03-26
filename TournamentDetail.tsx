import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Trophy, Calendar, Users, Trash2, Settings, Search, X, User, Award } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MatchCard from '@/components/match/MatchCard';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import EditModal from '@/components/shared/EditModal';
import { toast } from '@/hooks/use-toast';

const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', format: '', start_date: '', end_date: '' });
  const [teamSearch, setTeamSearch] = useState('');

  const { data: tournament, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: matches } = useQuery({
    queryKey: ['tournamentMatches', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select(`*, team_a:teams!matches_team_a_id_fkey(id, name, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, logo_url)`)
        .eq('tournament_id', id)
        .order('match_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tournamentTeams, refetch: refetchTeams } = useQuery({
    queryKey: ['tournamentTeams', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('tournament_teams')
        .select('*, team:teams(id, name)')
        .eq('tournament_id', id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: allTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: creatorProfile } = useQuery({
    queryKey: ['creator-profile', tournament?.created_by],
    queryFn: async () => {
      if (!tournament?.created_by) return null;
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', tournament.created_by).maybeSingle();
      return data;
    },
    enabled: !!tournament?.created_by,
  });

  const { data: allInnings } = useQuery({
    queryKey: ['tournament-innings', id],
    queryFn: async () => {
      if (!matches) return [];
      const matchIds = matches.filter(m => m.status === 'completed').map(m => m.id);
      if (matchIds.length === 0) return [];
      const { data } = await supabase.from('innings').select('*').in('match_id', matchIds);
      return data || [];
    },
    enabled: !!matches,
  });

  // All ball data for auto awards
  const { data: allBallData } = useQuery({
    queryKey: ['tournament-balls', id],
    queryFn: async () => {
      if (!allInnings || allInnings.length === 0) return [];
      const inningsIds = allInnings.map(i => i.id);
      if (inningsIds.length === 0) return [];
      const { data } = await supabase.from('ball_by_ball').select('*').in('innings_id', inningsIds);
      return data || [];
    },
    enabled: !!allInnings && allInnings.length > 0,
  });

  // All players from tournament teams
  const { data: allTournamentPlayers } = useQuery({
    queryKey: ['tournament-players', tournamentTeams],
    queryFn: async () => {
      const teamIds = (tournamentTeams || []).map((tt: any) => tt.team?.id).filter(Boolean);
      if (teamIds.length === 0) return [];
      const { data } = await supabase.from('team_members').select('id, player_name, team_id').in('team_id', teamIds);
      return data || [];
    },
    enabled: !!tournamentTeams && tournamentTeams.length > 0,
  });

  // Auto-calculated tournament awards
  const autoTournamentAwards = useMemo(() => {
    if (!allBallData || allBallData.length === 0 || !allTournamentPlayers) return [];
    
    const playerMap = new Map<string, string>();
    (allTournamentPlayers || []).forEach((p: any) => playerMap.set(p.id, p.player_name));

    const playerBatting = new Map<string, { runs: number; balls: number }>();
    const playerBowling = new Map<string, { wickets: number; runs: number; legalBalls: number }>();
    const playerCatches = new Map<string, number>();

    allBallData.forEach((b: any) => {
      if (b.batter_id && playerMap.has(b.batter_id)) {
        const e = playerBatting.get(b.batter_id) || { runs: 0, balls: 0 };
        if (!b.is_bye && !b.is_leg_bye) e.runs += b.runs_scored;
        if (!b.is_wide) e.balls += 1;
        playerBatting.set(b.batter_id, e);
      }
      if (b.bowler_id && playerMap.has(b.bowler_id)) {
        const e = playerBowling.get(b.bowler_id) || { wickets: 0, runs: 0, legalBalls: 0 };
        e.runs += b.runs_scored + (b.is_wide || b.is_no_ball ? 1 : 0);
        if (b.is_wicket) e.wickets += 1;
        if (!b.is_wide && !b.is_no_ball) e.legalBalls += 1;
        playerBowling.set(b.bowler_id, e);
      }
      if (b.is_wicket && b.dismissal_type === 'caught' && b.fielder_id && playerMap.has(b.fielder_id)) {
        playerCatches.set(b.fielder_id, (playerCatches.get(b.fielder_id) || 0) + 1);
      }
    });

    const awards: { type: string; playerId: string; playerName: string; value: string }[] = [];

    // Most Runs
    let bestBatId = '', bestBatRuns = -1;
    playerBatting.forEach((v, k) => { if (v.runs > bestBatRuns) { bestBatRuns = v.runs; bestBatId = k; } });
    if (bestBatId) awards.push({ type: 'Most Runs', playerId: bestBatId, playerName: playerMap.get(bestBatId) || '', value: `${bestBatRuns} runs` });

    // Most Wickets
    let bestBowlId = '', bestBowlW = -1;
    playerBowling.forEach((v, k) => { if (v.wickets > bestBowlW) { bestBowlW = v.wickets; bestBowlId = k; } });
    if (bestBowlId && bestBowlW > 0) awards.push({ type: 'Most Wickets', playerId: bestBowlId, playerName: playerMap.get(bestBowlId) || '', value: `${bestBowlW} wickets` });

    // Most Catches
    let bestFieldId = '', bestCatches = 0;
    playerCatches.forEach((v, k) => { if (v > bestCatches) { bestCatches = v; bestFieldId = k; } });
    if (bestFieldId && bestCatches > 0) awards.push({ type: 'Most Catches', playerId: bestFieldId, playerName: playerMap.get(bestFieldId) || '', value: `${bestCatches} catches` });

    // Best All-Rounder (runs + wickets*25)
    let bestArId = '', bestArScore = -1;
    const allIds = new Set([...playerBatting.keys(), ...playerBowling.keys()]);
    allIds.forEach(pid => {
      const bat = playerBatting.get(pid);
      const bowl = playerBowling.get(pid);
      if (bat && bowl && bowl.wickets > 0) {
        const score = bat.runs + bowl.wickets * 25;
        if (score > bestArScore) { bestArScore = score; bestArId = pid; }
      }
    });
    if (bestArId) awards.push({ type: 'Best All-Rounder', playerId: bestArId, playerName: playerMap.get(bestArId) || '', value: '' });

    // MVP = highest overall impact
    let mvpId = '', mvpScore = -1;
    allIds.forEach(pid => {
      const bat = playerBatting.get(pid);
      const bowl = playerBowling.get(pid);
      const catches = playerCatches.get(pid) || 0;
      const score = (bat?.runs || 0) + (bowl?.wickets || 0) * 25 + catches * 10;
      if (score > mvpScore) { mvpScore = score; mvpId = pid; }
    });
    if (mvpId) awards.push({ type: 'Player of the Series', playerId: mvpId, playerName: playerMap.get(mvpId) || '', value: '' });

    return awards;
  }, [allBallData, allTournamentPlayers]);

  // Compute standings with correct NRR
  interface StandingEntry {
    id: string; name: string; played: number; won: number; lost: number; nr: number; points: number; nrr: number;
    runsScored: number; oversFaced: number; runsConceded: number; oversBowled: number;
  }

  const standings: StandingEntry[] = useMemo(() => {
    const teams: StandingEntry[] = (tournamentTeams || []).map((tt: any) => ({
      id: tt.team?.id || '',
      name: tt.team?.name || 'Unknown',
      played: 0, won: 0, lost: 0, nr: 0, points: 0, nrr: 0,
      runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0,
    }));

    const teamMap = new Map(teams.map(t => [t.id, t]));

    (matches || []).filter((m: any) => m.status === 'completed').forEach((m: any) => {
      const teamA = teamMap.get(m.team_a_id);
      const teamB = teamMap.get(m.team_b_id);
      if (!teamA || !teamB) return;

      teamA.played += 1;
      teamB.played += 1;

      const matchInnings = (allInnings || []).filter((i: any) => i.match_id === m.id);
      const inn1 = matchInnings.find((i: any) => i.innings_number === 1);
      const inn2 = matchInnings.find((i: any) => i.innings_number === 2);

      if (inn1 && inn2) {
        // Convert overs from decimal (e.g. 4.3) to actual overs for NRR
        const parseOvers = (ov: number): number => {
          const full = Math.floor(ov);
          const balls = Math.round((ov - full) * 10);
          return full + balls / 6;
        };

        const battingFirstTeam = teamMap.get(inn1.batting_team_id);
        const battingSecondTeam = teamMap.get(inn2.batting_team_id);

        if (battingFirstTeam) {
          battingFirstTeam.runsScored += inn1.total_runs;
          battingFirstTeam.oversFaced += parseOvers(parseFloat(String(inn1.total_overs)) || 0);
          battingFirstTeam.runsConceded += inn2.total_runs;
          battingFirstTeam.oversBowled += parseOvers(parseFloat(String(inn2.total_overs)) || 0);
        }
        if (battingSecondTeam) {
          battingSecondTeam.runsScored += inn2.total_runs;
          battingSecondTeam.oversFaced += parseOvers(parseFloat(String(inn2.total_overs)) || 0);
          battingSecondTeam.runsConceded += inn1.total_runs;
          battingSecondTeam.oversBowled += parseOvers(parseFloat(String(inn1.total_overs)) || 0);
        }
      }

      // Use winner_team_id from match
      const winnerId = (m as any).winner_team_id;
      if (winnerId) {
        const winner = teamMap.get(winnerId);
        const loserId = winnerId === m.team_a_id ? m.team_b_id : m.team_a_id;
        const loser = teamMap.get(loserId);
        if (winner) { winner.won += 1; winner.points += 2; }
        if (loser) { loser.lost += 1; }
      }
      // If no winner (tie), both get 0 points
    });

    // Calculate NRR
    teams.forEach(t => {
      if (t.oversFaced > 0 && t.oversBowled > 0) {
        t.nrr = (t.runsScored / t.oversFaced) - (t.runsConceded / t.oversBowled);
      }
    });

    return teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.nrr !== a.nrr) return b.nrr - a.nrr;
      return a.name.localeCompare(b.name);
    });
  }, [tournamentTeams, matches, allInnings]);

  const addTeamToTournament = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await (supabase as any).from('tournament_teams').insert({ tournament_id: id, team_id: teamId });
      if (error) throw error;
    },
    onSuccess: () => { refetchTeams(); setTeamSearch(''); toast({ title: 'Team added' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeTeamFromTournament = useMutation({
    mutationFn: async (ttId: string) => {
      const { error } = await (supabase as any).from('tournament_teams').delete().eq('id', ttId);
      if (error) throw error;
    },
    onSuccess: () => { refetchTeams(); toast({ title: 'Team removed' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteTournament = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tournaments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({ title: 'Tournament deleted' });
      navigate('/tournaments');
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateTournament = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('tournaments').update({
        name: editData.name.trim(),
        format: editData.format || null,
        start_date: editData.start_date || null,
        end_date: editData.end_date || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      toast({ title: 'Tournament updated' });
      setEditOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (isLoading || !tournament) {
    return (
      <MobileLayout>
        <PageHeader title="Tournament" showBack />
        <div className="p-4"><div className="h-40 rounded-2xl bg-secondary animate-pulse" /></div>
      </MobileLayout>
    );
  }

  const isOwner = user?.id === tournament.created_by;
  const existingTeamIds = (tournamentTeams || []).map((tt: any) => tt.team?.id).filter(Boolean);
  const filteredTeams = allTeams?.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()) && !existingTeamIds.includes(t.id)) || [];
  const hasCompletedMatches = matches?.some(m => m.status === 'completed');

  return (
    <MobileLayout>
      <PageHeader
        title={tournament.name}
        showBack
        rightAction={isOwner && (
          <Button variant="ghost" size="icon" onClick={() => {
            setEditData({
              name: tournament.name, format: tournament.format || '',
              start_date: tournament.start_date || '', end_date: tournament.end_date || '',
            });
            setEditOpen(true);
          }}><Settings className="w-5 h-5" /></Button>
        )}
      />

      <div className="px-4 py-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-6 text-accent-foreground">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center"><Trophy className="w-8 h-8" /></div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{tournament.name}</h2>
              {tournament.format && <p className="text-white/80">{tournament.format}</p>}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-white/80">
            {tournament.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(tournament.start_date), 'MMM d, yyyy')}{tournament.end_date && ` - ${format(new Date(tournament.end_date), 'MMM d, yyyy')}`}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{isOwner ? 'You' : creatorProfile?.full_name || 'Unknown'}</span>
            </div>
          </div>
        </motion.div>

        {/* Auto Awards */}
        {hasCompletedMatches && autoTournamentAwards.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-amber-500" /> Tournament Awards</h3>
            <div className="space-y-2">
              {autoTournamentAwards.map((a, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{a.type}</span>
                  <span className="font-medium">{a.playerName} {a.value && <span className="text-xs text-muted-foreground">({a.value})</span>}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button onClick={() => navigate(`/matches/create?tournament=${id}`)} className="flex-1">
                <Plus className="w-4 h-4 mr-2" /> Add Match
              </Button>
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        <Tabs defaultValue="standings" className="mt-4">
          <TabsList className="w-full grid grid-cols-3 h-12 rounded-xl">
            <TabsTrigger value="standings" className="rounded-lg">Standings</TabsTrigger>
            <TabsTrigger value="matches" className="rounded-lg"><Trophy className="w-4 h-4 mr-1" />Matches</TabsTrigger>
            <TabsTrigger value="teams" className="rounded-lg"><Users className="w-4 h-4 mr-1" />Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="mt-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Points Table • Win = 2 pts</p>
              </div>
              {standings.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs border-b border-border">
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-2 py-2 text-left">Team</th>
                      <th className="px-2 py-2 text-center">P</th>
                      <th className="px-2 py-2 text-center">W</th>
                      <th className="px-2 py-2 text-center">L</th>
                      <th className="px-2 py-2 text-center">Pts</th>
                      <th className="px-2 py-2 text-center">NRR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, i) => (
                      <tr key={team.id || i} className="border-b border-border/50 last:border-0">
                        <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-2.5 font-medium truncate max-w-[100px]">
                          <Link to={`/teams/${team.id}`} className="hover:underline text-primary">{team.name}</Link>
                        </td>
                        <td className="px-2 py-2.5 text-center">{team.played}</td>
                        <td className="px-2 py-2.5 text-center">{team.won}</td>
                        <td className="px-2 py-2.5 text-center">{team.lost}</td>
                        <td className="px-2 py-2.5 text-center font-bold">{team.points}</td>
                        <td className="px-2 py-2.5 text-center text-muted-foreground">{team.nrr >= 0 ? '+' : ''}{team.nrr.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">Add teams to see standings</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="matches" className="mt-4">
            {matches && matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map((match: any) => (
                  <MatchCard key={match.id} id={match.id} name={match.name} teamA={match.team_a} teamB={match.team_b} matchDate={match.match_date} venue={match.venue} status={match.status} overs={match.overs} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No matches yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams" className="mt-4 space-y-4">
            {isOwner && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search teams to add..." value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} className="pl-10" />
                </div>
                {teamSearch && filteredTeams.length > 0 && (
                  <div className="bg-card border border-border rounded-xl max-h-40 overflow-y-auto">
                    {filteredTeams.map((team) => (
                      <button key={team.id} type="button" onClick={() => addTeamToTournament.mutate(team.id)} className="w-full text-left px-4 py-3 hover:bg-secondary text-sm border-b border-border last:border-0">
                        + {team.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {tournamentTeams && tournamentTeams.length > 0 ? (
              <div className="space-y-2">
                {tournamentTeams.map((tt: any) => (
                  <div key={tt.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <Link to={`/teams/${tt.team?.id}`} className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {tt.team?.name?.charAt(0) || '?'}
                      </div>
                      <span className="font-medium text-sm hover:underline">{tt.team?.name || 'Unknown'}</span>
                    </Link>
                    {isOwner && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTeamFromTournament.mutate(tt.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No teams added yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => deleteTournament.mutate()} title="Delete Tournament" description={`Delete "${tournament.name}"? This cannot be undone.`} loading={deleteTournament.isPending} />

      <EditModal open={editOpen} onClose={() => setEditOpen(false)} onSave={() => updateTournament.mutate()} title="Edit Tournament" loading={updateTournament.isPending}>
        <div className="space-y-2"><Label>Tournament Name</Label><Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} /></div>
        <div className="space-y-2">
          <Label>Format</Label>
          <Select value={editData.format} onValueChange={(v) => setEditData({ ...editData, format: v })}>
            <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
            <SelectContent className="bg-card z-50">
              <SelectItem value="League">League</SelectItem>
              <SelectItem value="Knockout">Knockout</SelectItem>
              <SelectItem value="Round Robin">Round Robin</SelectItem>
              <SelectItem value="Group + Knockout">Group + Knockout</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={editData.start_date} onChange={(e) => setEditData({ ...editData, start_date: e.target.value })} /></div>
          <div className="space-y-2"><Label>End Date</Label><Input type="date" value={editData.end_date} onChange={(e) => setEditData({ ...editData, end_date: e.target.value })} /></div>
        </div>
      </EditModal>
    </MobileLayout>
  );
};

export default TournamentDetailPage;
