import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const CreateTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState('');

  const createTeam = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in');
      if (!teamName.trim()) throw new Error('Team name is required');
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName.trim(), created_by: user.id })
        .select()
        .single();
      if (teamError) throw teamError;
      return team;
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({ title: 'Team created!', description: `${team.name} is ready. Add players now.` });
      navigate(`/teams/${team.id}`);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (!user) {
    return (
      <MobileLayout>
        <PageHeader title="Create Team" showBack />
        <div className="flex flex-col items-center justify-center p-8 mt-12">
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in required</h2>
          <p className="text-muted-foreground text-center mb-4">You need to sign in to create a team.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PageHeader title="Create Team" showBack />
      <div className="px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input id="teamName" placeholder="e.g., Thunder Warriors" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="h-12" />
          </div>
          <p className="text-sm text-muted-foreground">You can add players after the team is created.</p>
        </motion.div>
        <Button onClick={() => createTeam.mutate()} className="w-full h-14 text-lg" disabled={createTeam.isPending || !teamName.trim()}>
          {createTeam.isPending ? 'Creating...' : 'Create Team'}
        </Button>
      </div>
    </MobileLayout>
  );
};

export default CreateTeamPage;
