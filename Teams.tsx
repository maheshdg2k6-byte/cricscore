import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TeamsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Get team IDs where user is a member
  const { data: memberTeamIds } = useQuery({
    queryKey: ['my-team-ids', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('team_members').select('team_id').eq('user_id', user.id);
      return data?.map(d => d.team_id) || [];
    },
    enabled: !!user,
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', searchQuery, user?.id, memberTeamIds],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select(`*, team_members(count)`)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Only show user's teams (created by or member of)
      if (user) {
        const myTeamIds = memberTeamIds || [];
        const allIds = [...new Set(myTeamIds)];
        if (allIds.length > 0) {
          query = query.or(`created_by.eq.${user.id},id.in.(${allIds.join(',')})`);
        } else {
          query = query.eq('created_by', user.id);
        }
      } else {
        // Guest: show nothing
        return [];
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <MobileLayout>
      <PageHeader
        title="My Teams"
        rightAction={
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/search')} className="rounded-lg">
              <Search className="w-5 h-5" />
            </Button>
            {user && (
              <Button size="icon" onClick={() => navigate('/teams/create')} className="rounded-full">
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>
        }
      />

      <div className="px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search your teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-12 rounded-xl" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-2xl bg-secondary animate-pulse" />)}
          </div>
        ) : teams && teams.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
            {teams.map((team, index) => (
              <motion.button
                key={team.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-2xl font-bold mb-3">
                  {team.name.charAt(0)}
                </div>
                <span className="font-semibold text-foreground">{team.name}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {(team.team_members as { count: number }[])?.[0]?.count || 0} players
                </span>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No teams found</h3>
            <p className="text-muted-foreground mb-4">{searchQuery ? 'Try a different search term' : 'Create or join a team to get started'}</p>
            {user && <Button onClick={() => navigate('/teams/create')}><Plus className="w-4 h-4 mr-2" />Create Team</Button>}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default TeamsPage;
