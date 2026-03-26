import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trophy, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TournamentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['tournaments', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

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
        title="Tournaments"
        rightAction={
          user && (
            <Button
              size="icon"
              onClick={() => navigate('/tournaments/create')}
              className="rounded-full"
            >
              <Plus className="w-5 h-5" />
            </Button>
          )
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl"
          />
        </div>

        {/* Tournaments List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-secondary animate-pulse"
              />
            ))}
          </div>
        ) : tournaments && tournaments.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {tournaments.map((tournament, index) => (
              <motion.button
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                className="w-full p-4 rounded-2xl bg-card border border-border text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
                    <Trophy className="w-7 h-7 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {tournament.name}
                    </h3>
                    {tournament.format && (
                      <p className="text-sm text-muted-foreground">
                        {tournament.format}
                      </p>
                    )}
                    {tournament.start_date && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {format(new Date(tournament.start_date), 'MMM d, yyyy')}
                          {tournament.end_date && ` - ${format(new Date(tournament.end_date), 'MMM d, yyyy')}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No tournaments found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first tournament to get started'}
            </p>
            {user && (
              <Button onClick={() => navigate('/tournaments/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default TournamentsPage;
