import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, Trophy, X, Search, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const FORMAT_INFO: Record<string, string> = {
  'League': 'Every team plays against every other team. Team with most points wins. Best for longer tournaments.',
  'Knockout': 'Single elimination. Lose once and you\'re out. Quick and decisive.',
  'Round Robin': 'All teams play each other in a round-robin format. Fair but requires more matches.',
  'Group + Knockout': 'Teams divided into groups. Top teams from each group advance to knockout stage. Used in World Cups.',
};

const CreateTournamentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    format: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState('');

  const { data: allTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const filteredTeams = allTeams?.filter(t =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase()) && !selectedTeamIds.includes(t.id)
  ) || [];

  const selectedTeams = allTeams?.filter(t => selectedTeamIds.includes(t.id)) || [];

  const createTournament = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in');
      if (!formData.name.trim()) throw new Error('Tournament name is required');

      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert({
          name: formData.name.trim(),
          format: formData.format || null,
          start_date: formData.startDate?.toISOString().split('T')[0] || null,
          end_date: formData.endDate?.toISOString().split('T')[0] || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add teams to tournament
      if (selectedTeamIds.length > 0) {
        const { error: teamsError } = await (supabase as any).from('tournament_teams').insert(
          selectedTeamIds.map(teamId => ({
            tournament_id: tournament.id,
            team_id: teamId,
          }))
        );
        if (teamsError) throw teamsError;
      }

      return tournament;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast({ title: 'Tournament created!', description: `${data.name} is ready.` });
      navigate(`/tournaments/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (!user) {
    return (
      <MobileLayout>
        <PageHeader title="Create Tournament" showBack />
        <div className="flex flex-col items-center justify-center p-8 mt-12">
          <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in required</h2>
          <p className="text-muted-foreground text-center mb-4">You need to sign in to create a tournament.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PageHeader title="Create Tournament" showBack />

      <div className="px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Tournament Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name</Label>
            <Input id="name" placeholder="e.g., Premier League 2024" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12" />
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(FORMAT_INFO).map(([fmt, desc]) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormData({ ...formData, format: fmt })}
                  className={cn(
                    'p-3 rounded-xl border text-left text-sm transition-colors',
                    formData.format === fmt
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <div className="font-medium text-foreground">{fmt}</div>
                  <p className="text-xs mt-1 line-clamp-2">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full h-12 justify-start text-left font-normal', !formData.startDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card z-50" align="start">
                  <Calendar mode="single" selected={formData.startDate} onSelect={(date) => setFormData({ ...formData, startDate: date })} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full h-12 justify-start text-left font-normal', !formData.endDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card z-50" align="start">
                  <Calendar mode="single" selected={formData.endDate} onSelect={(date) => setFormData({ ...formData, endDate: date })} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-3">
            <Label>Add Teams</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="h-12 pl-10"
              />
            </div>

            {teamSearch && filteredTeams.length > 0 && (
              <div className="bg-card border border-border rounded-xl max-h-40 overflow-y-auto">
                {filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => { setSelectedTeamIds([...selectedTeamIds, team.id]); setTeamSearch(''); }}
                    className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors text-sm border-b border-border last:border-0"
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            )}

            {selectedTeams.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTeams.map((team) => (
                  <span key={team.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {team.name}
                    <button type="button" onClick={() => setSelectedTeamIds(selectedTeamIds.filter(id => id !== team.id))}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''} selected</p>
          </div>
        </motion.div>

        <Button onClick={() => createTournament.mutate()} className="w-full h-14 text-lg" disabled={createTournament.isPending}>
          {createTournament.isPending ? 'Creating...' : 'Create Tournament'}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default CreateTournamentPage;
