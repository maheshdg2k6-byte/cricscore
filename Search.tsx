import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Users, Trophy, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const { data: teams } = useQuery({
    queryKey: ['search-teams', submittedQuery],
    queryFn: async () => {
      if (!submittedQuery.trim()) return [];
      const { data } = await supabase.from('teams').select('id, name').ilike('name', `%${submittedQuery}%`).limit(20);
      return data || [];
    },
    enabled: submittedQuery.trim().length >= 2,
  });

  const { data: players } = useQuery({
    queryKey: ['search-players', submittedQuery],
    queryFn: async () => {
      if (!submittedQuery.trim()) return [];
      const { data } = await supabase.from('profiles').select('user_id, full_name, playing_role').ilike('full_name', `%${submittedQuery}%`).limit(20);
      return data || [];
    },
    enabled: submittedQuery.trim().length >= 2,
  });

  const { data: tournaments } = useQuery({
    queryKey: ['search-tournaments', submittedQuery],
    queryFn: async () => {
      if (!submittedQuery.trim()) return [];
      const { data } = await supabase.from('tournaments').select('id, name, format').ilike('name', `%${submittedQuery}%`).limit(20);
      return data || [];
    },
    enabled: submittedQuery.trim().length >= 2,
  });

  const ROLE_LABELS: Record<string, string> = {
    batsman: 'Batsman', bowler: 'Bowler', allrounder: 'All-Rounder', wk_batsman: 'WK-Batsman',
  };

  const handleSearch = () => {
    if (query.trim().length >= 2) setSubmittedQuery(query.trim());
  };

  const hasResults = submittedQuery.trim().length >= 2;

  return (
    <MobileLayout>
      <PageHeader title="Search" />
      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search players, teams, tournaments..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-12 rounded-xl"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            className="h-12 px-4 bg-primary text-primary-foreground rounded-xl font-medium text-sm"
          >
            Search
          </button>
        </div>

        {hasResults ? (
          <Tabs defaultValue="all" className="mt-2">
            <TabsList className="w-full grid grid-cols-4 h-10 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
              <TabsTrigger value="players" className="rounded-lg text-xs">Players</TabsTrigger>
              <TabsTrigger value="teams" className="rounded-lg text-xs">Teams</TabsTrigger>
              <TabsTrigger value="tournaments" className="rounded-lg text-xs">Tournaments</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-4">
              {players && players.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Players</h3>
                  <div className="space-y-1.5">
                    {players.slice(0, 5).map((p) => (
                      <button
                        key={p.user_id}
                        onClick={() => navigate(`/profile/${p.user_id}`)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border w-full text-left hover:border-primary/30 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{p.full_name}</p>
                          {p.playing_role && <p className="text-xs text-muted-foreground">{ROLE_LABELS[p.playing_role] || p.playing_role}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {teams && teams.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Teams</h3>
                  <div className="space-y-1.5">
                    {teams.slice(0, 5).map((t) => (
                      <button key={t.id} onClick={() => navigate(`/teams/${t.id}`)} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border w-full text-left hover:border-primary/30 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{t.name.charAt(0)}</div>
                        <p className="text-sm font-medium">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tournaments && tournaments.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tournaments</h3>
                  <div className="space-y-1.5">
                    {tournaments.slice(0, 5).map((t) => (
                      <button key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border w-full text-left hover:border-primary/30 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-accent" /></div>
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          {t.format && <p className="text-xs text-muted-foreground">{t.format}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(!players || players.length === 0) && (!teams || teams.length === 0) && (!tournaments || tournaments.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No results found for "{submittedQuery}"</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="players" className="mt-4">
              {players && players.length > 0 ? (
                <div className="space-y-1.5">
                  {players.map((p) => (
                    <button
                      key={p.user_id}
                      onClick={() => navigate(`/profile/${p.user_id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border w-full text-left hover:border-primary/30 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.full_name}</p>
                        {p.playing_role && <p className="text-xs text-muted-foreground">{ROLE_LABELS[p.playing_role] || p.playing_role}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-8">No players found</p>}
            </TabsContent>

            <TabsContent value="teams" className="mt-4">
              {teams && teams.length > 0 ? (
                <div className="space-y-1.5">
                  {teams.map((t) => (
                    <button key={t.id} onClick={() => navigate(`/teams/${t.id}`)} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border w-full text-left hover:border-primary/30 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{t.name.charAt(0)}</div>
                      <p className="text-sm font-medium">{t.name}</p>
                    </button>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-8">No teams found</p>}
            </TabsContent>

            <TabsContent value="tournaments" className="mt-4">
              {tournaments && tournaments.length > 0 ? (
                <div className="space-y-1.5">
                  {tournaments.map((t) => (
                    <button key={t.id} onClick={() => navigate(`/tournaments/${t.id}`)} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border w-full text-left hover:border-primary/30 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-accent" /></div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        {t.format && <p className="text-xs text-muted-foreground">{t.format}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-8">No tournaments found</p>}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>Search for players, teams, or tournaments</p>
            <p className="text-xs mt-1">Type and press Search or Enter</p>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default SearchPage;
