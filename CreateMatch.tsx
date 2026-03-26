import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarIcon, MapPin, Clock, Users, Info } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const FORMAT_PRESETS = [
  { label: 'T20', overs: 20, desc: '20 overs per side. Fast-paced limited overs cricket.' },
  { label: 'ODI', overs: 50, desc: '50 overs per side. One Day International format.' },
  { label: 'Test', overs: 0, desc: 'Unlimited overs. Innings ends on all out or declaration.' },
  { label: 'Custom', overs: -1, desc: 'Set your own number of overs.' },
];

const CreateMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    teamAId: '',
    teamBId: '',
    date: new Date(),
    time: '14:00',
    overs: 20,
    venue: '',
    formatPreset: 'T20',
  });

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('id, name').order('name');
      if (error) throw error;
      return data;
    },
  });

  const createMatch = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in to create a match');
      const [hours, minutes] = formData.time.split(':').map(Number);
      const matchDate = new Date(formData.date);
      matchDate.setHours(hours, minutes, 0, 0);

      const { data, error } = await supabase
        .from('matches')
        .insert({
          name: formData.name,
          team_a_id: formData.teamAId || null,
          team_b_id: formData.teamBId || null,
          match_date: matchDate.toISOString(),
          venue: formData.venue || null,
          overs: formData.overs,
          created_by: user.id,
          scorer_id: user.id,
          tournament_id: tournamentId || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast({ title: 'Match created!', description: 'You can now start scoring.' });
      navigate(`/match/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter a match name.', variant: 'destructive' });
      return;
    }
    createMatch.mutate();
  };

  const handleFormatSelect = (preset: string) => {
    const found = FORMAT_PRESETS.find(f => f.label === preset);
    if (!found) return;
    setFormData({
      ...formData,
      formatPreset: preset,
      overs: found.overs === -1 ? formData.overs : found.overs,
    });
  };

  if (!user) {
    return (
      <MobileLayout>
        <PageHeader title="Create Match" showBack />
        <div className="flex flex-col items-center justify-center p-8 mt-12">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in required</h2>
          <p className="text-muted-foreground text-center mb-4">You need to sign in to create a match.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PageHeader title="Create Match" showBack />

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Match Name</Label>
            <Input id="name" placeholder="e.g., Final - League Cup 2024" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12" />
          </div>

          {/* Teams */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Team A</Label>
              <Select value={formData.teamAId} onValueChange={(v) => setFormData({ ...formData, teamAId: v })}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {teams?.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team B</Label>
              <Select value={formData.teamBId} onValueChange={(v) => setFormData({ ...formData, teamBId: v })}>
                <SelectTrigger className="h-12"><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {teams?.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Match Format */}
          <div className="space-y-2">
            <Label>Match Format</Label>
            <div className="grid grid-cols-4 gap-2">
              {FORMAT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleFormatSelect(preset.label)}
                  className={cn(
                    'p-2.5 rounded-xl border text-center text-sm font-medium transition-colors',
                    formData.formatPreset === preset.label
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              {FORMAT_PRESETS.find(f => f.label === formData.formatPreset)?.desc}
            </p>
          </div>

          {/* Custom Overs */}
          {formData.formatPreset === 'Custom' && (
            <div className="space-y-2">
              <Label htmlFor="overs">Custom Overs</Label>
              <Input id="overs" type="number" min={1} max={500} placeholder="e.g., 30" value={formData.overs} onChange={(e) => setFormData({ ...formData, overs: Math.max(1, Number(e.target.value) || 1) })} className="h-12" />
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full h-12 justify-start text-left font-normal', !formData.date && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.date, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card z-50" align="start">
                  <Calendar mode="single" selected={formData.date} onSelect={(date) => date && setFormData({ ...formData, date })} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="h-12 pl-10" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue (optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="venue" placeholder="e.g., Central Park Ground" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} className="h-12 pl-10" />
            </div>
          </div>
        </motion.div>

        <Button type="submit" className="w-full h-14 text-lg" disabled={createMatch.isPending}>
          {createMatch.isPending ? 'Creating...' : 'Create Match'}
        </Button>
      </form>
    </MobileLayout>
  );
};

export default CreateMatchPage;
