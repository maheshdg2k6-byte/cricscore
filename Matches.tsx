import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import MatchCard from '@/components/match/MatchCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MatchStatus = 'all' | 'upcoming' | 'live' | 'completed';

const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<MatchStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', status, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('matches')
        .select(`
          *,
          team_a:teams!matches_team_a_id_fkey(id, name, logo_url),
          team_b:teams!matches_team_b_id_fkey(id, name, logo_url)
        `)
        .order('match_date', { ascending: status === 'upcoming' });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <MobileLayout>
      <PageHeader
        title="Matches"
        rightAction={
          <Button
            size="icon"
            onClick={() => navigate('/matches/create')}
            className="rounded-full"
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search matches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={status} onValueChange={(v) => setStatus(v as MatchStatus)}>
          <TabsList className="w-full grid grid-cols-4 h-12 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
            <TabsTrigger value="live" className="rounded-lg">Live</TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-lg">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg">Done</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Matches List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-secondary animate-pulse"
              />
            ))}
          </div>
        ) : matches && matches.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MatchCard
                  id={match.id}
                  name={match.name}
                  teamA={match.team_a}
                  teamB={match.team_b}
                  matchDate={match.match_date}
                  venue={match.venue}
                  status={match.status as 'upcoming' | 'live' | 'completed'}
                  overs={match.overs}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first match to get started'}
            </p>
            <Button onClick={() => navigate('/matches/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Match
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default MatchesPage;
