import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserPlus, Settings, Crown, Shield, Trash2, Pencil, Star, Trophy, TrendingUp, UserCheck, UserMinus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddPlayerByPhoneModal from '@/components/team/AddPlayerByPhoneModal';
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog';
import EditModal from '@/components/shared/EditModal';
import { toast } from '@/hooks/use-toast';
import MatchCard from '@/components/match/MatchCard';
import { format } from 'date-fns';

const PLAYING_ROLES: Record<string, string> = {
  batsman: 'Batsman', bowler: 'Bowler', allrounder: 'All-Rounder', wk_batsman: 'WK-Batsman',
};
const BATTING_STYLES: Record<string, string> = {
  right_hand: 'RHB', left_hand: 'LHB',
};
const BOWLING_STYLES: Record<string, string> = {
  right_arm_fast: 'RAF', right_arm_medium: 'RAM', left_arm_fast: 'LAF', left_arm_medium: 'LAM',
  right_arm_off_spin: 'RAOS', right_arm_leg_spin: 'RALS', left_arm_spin: 'LAS', left_arm_chinaman: 'LAC',
};

const TeamDetailPage: React.FC = () => {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [deleteTeamOpen, setDeleteTeamOpen] = useState(false);
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editPlayerOpen, setEditPlayerOpen] = useState(false);
  const [deletePlayerOpen, setDeletePlayerOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [editPlayerData, setEditPlayerData] = useState({
    player_name: '', is_captain: false, is_vice_captain: false, is_wicket_keeper: false,
    playing_role: '', batting_style: '', bowling_style: '',
  });
  const [adminEmail, setAdminEmail] = useState('');

  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ['teamMembers', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('team_members').select('*').eq('team_id', id).order('player_name');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Team admins
  const { data: admins, refetch: refetchAdmins } = useQuery({
    queryKey: ['teamAdmins', id],
    queryFn: async () => {
      const { data } = await supabase.from('team_admins' as any).select('*').eq('team_id', id);
      return (data as any[]) || [];
    },
    enabled: !!id,
  });

  // Team matches
  const { data: teamMatches } = useQuery({
    queryKey: ['team-matches', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select(`*, team_a:teams!matches_team_a_id_fkey(id, name, logo_url), team_b:teams!matches_team_b_id_fkey(id, name, logo_url)`)
        .or(`team_a_id.eq.${id},team_b_id.eq.${id}`)
        .order('match_date', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!id,
  });

  // Team stats from matches
  const teamStats = React.useMemo(() => {
    if (!teamMatches) return { played: 0, won: 0, lost: 0, tied: 0 };
    const completed = teamMatches.filter((m: any) => m.status === 'completed');
    const won = completed.filter((m: any) => (m as any).winner_team_id === id).length;
    const tied = completed.filter((m: any) => !(m as any).winner_team_id && (m as any).result_summary?.includes('Tied')).length;
    return { played: completed.length, won, lost: completed.length - won - tied, tied };
  }, [teamMatches, id]);

  const deleteTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Team deleted' });
      navigate('/teams');
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('teams').update({ name: editTeamName.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      toast({ title: 'Team updated' });
      setEditTeamOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updatePlayer = useMutation({
    mutationFn: async () => {
      const updateData: any = {
        player_name: editPlayerData.player_name.trim(),
        is_captain: editPlayerData.is_captain,
        is_vice_captain: editPlayerData.is_vice_captain,
        is_wicket_keeper: editPlayerData.is_wicket_keeper,
        playing_role: editPlayerData.playing_role || null,
        batting_style: editPlayerData.batting_style || null,
        bowling_style: editPlayerData.bowling_style || null,
      };
      const { error } = await supabase.from('team_members').update(updateData).eq('id', selectedPlayer.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', id] });
      toast({ title: 'Player updated' });
      setEditPlayerOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deletePlayer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('team_members').delete().eq('id', selectedPlayer.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', id] });
      toast({ title: 'Player removed' });
      setDeletePlayerOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const addAdmin = useMutation({
    mutationFn: async () => {
      if (!adminEmail.trim()) throw new Error('Enter an email');
      const { data: profile } = await supabase.from('profiles').select('user_id').eq('full_name', adminEmail.trim()).maybeSingle();
      if (!profile) throw new Error('User not found. Enter their exact display name.');
      const { error } = await supabase.from('team_admins' as any).insert({ team_id: id, user_id: profile.user_id });
      if (error) throw error;
    },
    onSuccess: () => { refetchAdmins(); setAdminEmail(''); toast({ title: 'Admin added!' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeAdmin = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase.from('team_admins' as any).delete().eq('id', adminId);
      if (error) throw error;
    },
    onSuccess: () => { refetchAdmins(); toast({ title: 'Admin removed' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (isLoading || !team) {
    return (
      <MobileLayout>
        <PageHeader title="Team" showBack />
        <div className="p-4 space-y-4">
          <div className="h-32 rounded-2xl bg-secondary animate-pulse" />
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />)}
        </div>
      </MobileLayout>
    );
  }

  const isOwner = user?.id === team.created_by;
  const isAdmin = admins?.some((a: any) => a.user_id === user?.id) || false;
  const canManage = isOwner || isAdmin;

  const upcomingMatches = teamMatches?.filter((m: any) => m.status === 'upcoming' || m.status === 'live') || [];
  const pastMatches = teamMatches?.filter((m: any) => m.status === 'completed') || [];

  const getRoleBadge = (member: any) => {
    const role = member.playing_role;
    if (!role) return null;
    return PLAYING_ROLES[role] || role;
  };

  const getStyleBadge = (member: any) => {
    const parts: string[] = [];
    if (member.batting_style) parts.push(BATTING_STYLES[member.batting_style] || member.batting_style);
    if (member.bowling_style) parts.push(BOWLING_STYLES[member.bowling_style] || member.bowling_style);
    return parts.join(' • ');
  };

  return (
    <MobileLayout>
      <PageHeader
        title={team.name}
        showBack
        rightAction={
          canManage && (
            <Button variant="ghost" size="icon" onClick={() => { setEditTeamName(team.name); setEditTeamOpen(true); }}>
              <Settings className="w-5 h-5" />
            </Button>
          )
        }
      />

      <div className="px-4 py-4 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center">
          {/* Banner */}
          <div className="w-full h-28 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4 overflow-hidden relative">
            {(team as any).banner_url && (
              <img src={(team as any).banner_url} alt="Team Banner" className="w-full h-full object-cover" />
            )}
          </div>
          {/* Logo */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-4xl font-bold text-primary-foreground mb-4 shadow-xl shadow-primary/30 -mt-14 border-4 border-background overflow-hidden">
            {(team as any).logo_url
              ? <img src={(team as any).logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
              : team.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold">{team.name}</h2>
          <p className="text-muted-foreground">{members?.length || 0} players</p>
          {/* Team stats */}
          {teamStats.played > 0 && (
            <div className="flex gap-4 mt-3 text-sm">
              <div className="text-center"><span className="font-bold">{teamStats.played}</span><br /><span className="text-xs text-muted-foreground">Played</span></div>
              <div className="text-center"><span className="font-bold text-green-600">{teamStats.won}</span><br /><span className="text-xs text-muted-foreground">Won</span></div>
              <div className="text-center"><span className="font-bold text-red-500">{teamStats.lost}</span><br /><span className="text-xs text-muted-foreground">Lost</span></div>
              {teamStats.tied > 0 && <div className="text-center"><span className="font-bold">{teamStats.tied}</span><br /><span className="text-xs text-muted-foreground">Tied</span></div>}
            </div>
          )}
          {canManage && (
            <Button variant="destructive" size="sm" className="mt-3" onClick={() => setDeleteTeamOpen(true)}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Team
            </Button>
          )}
        </motion.div>

        <Tabs defaultValue="squad" className="mt-2">
          <div className="overflow-x-auto no-scrollbar">
            <TabsList className="flex h-10 rounded-xl gap-1 min-w-max px-1 bg-secondary">
              <TabsTrigger value="squad" className="rounded-lg text-xs flex-shrink-0">Members</TabsTrigger>
              <TabsTrigger value="matches" className="rounded-lg text-xs flex-shrink-0">Matches</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-lg text-xs flex-shrink-0">Stats</TabsTrigger>
              <TabsTrigger value="leaderboard" className="rounded-lg text-xs flex-shrink-0">Leaderboard</TabsTrigger>
              <TabsTrigger value="photos" className="rounded-lg text-xs flex-shrink-0">Photos</TabsTrigger>
              {isOwner && <TabsTrigger value="admins" className="rounded-lg text-xs flex-shrink-0">Profile</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="squad" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Squad</h3>
              {canManage && (
                <Button variant="ghost" size="sm" onClick={() => setShowAddPlayer(true)}>
                  <UserPlus className="w-4 h-4 mr-1.5" /> Add Player
                </Button>
              )}
            </div>

            {members && members.length > 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {members.map((member: any, index: number) => (
                  <motion.div key={member.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">{member.player_name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{member.player_name}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {member.is_captain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 font-medium">C</span>}
                        {member.is_vice_captain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 font-medium">VC</span>}
                        {member.is_wicket_keeper && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">WK</span>}
                        {getRoleBadge(member) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">{getRoleBadge(member)}</span>}
                      </div>
                      {getStyleBadge(member) && <p className="text-[10px] text-muted-foreground mt-0.5">{getStyleBadge(member)}</p>}
                    </div>
                    <div className="flex gap-1 items-center flex-shrink-0">
                      {member.is_captain && <Crown className="w-4 h-4 text-amber-500" />}
                      {member.is_vice_captain && <Star className="w-4 h-4 text-blue-500" />}
                      {member.is_wicket_keeper && <Shield className="w-4 h-4 text-primary" />}
                      {canManage && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setSelectedPlayer(member);
                            setEditPlayerData({
                              player_name: member.player_name, is_captain: member.is_captain || false,
                              is_vice_captain: member.is_vice_captain || false, is_wicket_keeper: member.is_wicket_keeper || false,
                              playing_role: member.playing_role || '', batting_style: member.batting_style || '', bowling_style: member.bowling_style || '',
                            });
                            setEditPlayerOpen(true);
                          }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedPlayer(member); setDeletePlayerOpen(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">No players yet</p>
                {canManage && <Button variant="link" className="mt-2" onClick={() => setShowAddPlayer(true)}>Add your first player</Button>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="mt-4 space-y-4">
            {upcomingMatches.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Upcoming & Live</h4>
                <div className="space-y-2">
                  {upcomingMatches.map((m: any) => (
                    <MatchCard key={m.id} id={m.id} name={m.name} teamA={m.team_a} teamB={m.team_b} matchDate={m.match_date} venue={m.venue} status={m.status} overs={m.overs} />
                  ))}
                </div>
              </div>
            )}
            {pastMatches.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Past Matches</h4>
                <div className="space-y-2">
                  {pastMatches.map((m: any) => (
                    <MatchCard key={m.id} id={m.id} name={m.name} teamA={m.team_a} teamB={m.team_b} matchDate={m.match_date} venue={m.venue} status={m.status} overs={m.overs} />
                  ))}
                </div>
              </div>
            )}
            {(!teamMatches || teamMatches.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">No matches yet</div>
            )}
          </TabsContent>

          {isOwner && (
            <TabsContent value="admins" className="mt-4 space-y-4">
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2"><UserCheck className="w-4 h-4" /> Team Admins</h4>
                <p className="text-xs text-muted-foreground">Admins can add/remove players and edit team details.</p>
                <div className="flex gap-2">
                  <Input placeholder="Player display name" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="h-10" />
                  <Button size="sm" className="h-10" onClick={() => addAdmin.mutate()} disabled={addAdmin.isPending}>Add</Button>
                </div>
                {admins && admins.length > 0 ? (
                  <div className="space-y-2">
                    {admins.map((admin: any) => (
                      <div key={admin.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary">
                        <span className="text-sm">{admin.user_id?.substring(0, 8)}...</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAdmin.mutate(admin.id)}>
                          <UserMinus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No admins added yet. Only you (owner) can manage this team.</p>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {canManage && id && (
        <AddPlayerByPhoneModal
          teamId={id}
          open={showAddPlayer}
          onClose={() => setShowAddPlayer(false)}
          onPlayerAdded={() => queryClient.invalidateQueries({ queryKey: ['teamMembers', id] })}
        />
      )}

      <DeleteConfirmDialog open={deleteTeamOpen} onClose={() => setDeleteTeamOpen(false)} onConfirm={() => deleteTeam.mutate()} title="Delete Team" description={`Are you sure you want to delete "${team.name}"? This will also remove all players.`} loading={deleteTeam.isPending} />

      <EditModal open={editTeamOpen} onClose={() => setEditTeamOpen(false)} onSave={() => updateTeam.mutate()} title="Edit Team" loading={updateTeam.isPending}>
        <div className="space-y-2">
          <Label>Team Name</Label>
          <Input value={editTeamName} onChange={(e) => setEditTeamName(e.target.value)} />
        </div>
      </EditModal>

      <EditModal open={editPlayerOpen} onClose={() => setEditPlayerOpen(false)} onSave={() => updatePlayer.mutate()} title="Edit Player" loading={updatePlayer.isPending}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Player Name</Label>
            <Input value={editPlayerData.player_name} onChange={(e) => setEditPlayerData({ ...editPlayerData, player_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Playing Role</Label>
            <Select value={editPlayerData.playing_role} onValueChange={(v) => setEditPlayerData({ ...editPlayerData, playing_role: v })}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent className="bg-card z-50">
                <SelectItem value="batsman">Batsman</SelectItem>
                <SelectItem value="bowler">Bowler</SelectItem>
                <SelectItem value="allrounder">All-Rounder</SelectItem>
                <SelectItem value="wk_batsman">WK-Batsman</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Batting Style</Label>
              <Select value={editPlayerData.batting_style} onValueChange={(v) => setEditPlayerData({ ...editPlayerData, batting_style: v })}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="right_hand">Right Hand</SelectItem>
                  <SelectItem value="left_hand">Left Hand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bowling Style</Label>
              <Select value={editPlayerData.bowling_style} onValueChange={(v) => setEditPlayerData({ ...editPlayerData, bowling_style: v })}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="right_arm_fast">R Arm Fast</SelectItem>
                  <SelectItem value="right_arm_medium">R Arm Medium</SelectItem>
                  <SelectItem value="left_arm_fast">L Arm Fast</SelectItem>
                  <SelectItem value="left_arm_medium">L Arm Medium</SelectItem>
                  <SelectItem value="right_arm_off_spin">R Arm Off Spin</SelectItem>
                  <SelectItem value="right_arm_leg_spin">R Arm Leg Spin</SelectItem>
                  <SelectItem value="left_arm_spin">L Arm Spin</SelectItem>
                  <SelectItem value="left_arm_chinaman">L Arm Chinaman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm">Team Role</Label>
            <div className="flex items-center gap-2">
              <Checkbox checked={editPlayerData.is_captain} onCheckedChange={(v) => setEditPlayerData({ ...editPlayerData, is_captain: !!v, is_vice_captain: v ? false : editPlayerData.is_vice_captain })} />
              <Label className="font-normal">Captain</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={editPlayerData.is_vice_captain} onCheckedChange={(v) => setEditPlayerData({ ...editPlayerData, is_vice_captain: !!v, is_captain: v ? false : editPlayerData.is_captain })} />
              <Label className="font-normal">Vice Captain</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={editPlayerData.is_wicket_keeper} onCheckedChange={(v) => setEditPlayerData({ ...editPlayerData, is_wicket_keeper: !!v })} />
              <Label className="font-normal">Wicket Keeper</Label>
            </div>
          </div>
        </div>
      </EditModal>

      <DeleteConfirmDialog open={deletePlayerOpen} onClose={() => setDeletePlayerOpen(false)} onConfirm={() => deletePlayer.mutate()} title="Remove Player" description={`Remove "${selectedPlayer?.player_name}" from the team?`} loading={deletePlayer.isPending} />
    </MobileLayout>
  );
};

export default TeamDetailPage;
