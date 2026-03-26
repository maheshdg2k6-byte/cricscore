import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface InningsData {
  id: string;
  match_id: string;
  batting_team_id: string | null;
  bowling_team_id: string | null;
  innings_number: number;
  total_runs: number;
  total_wickets: number;
  total_overs: number;
  extras_wides: number;
  extras_no_balls: number;
  extras_byes: number;
  extras_leg_byes: number;
  is_completed: boolean;
}

interface MatchData {
  id: string;
  name: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  overs: number;
  team_a_id: string | null;
  team_b_id: string | null;
}

interface RealtimeScoreState {
  innings: InningsData | null;
  match: MatchData | null;
  isConnected: boolean;
  lastUpdate: Date | null;
}

export const useRealtimeScore = (matchId: string | undefined) => {
  const [state, setState] = useState<RealtimeScoreState>({
    innings: null,
    match: null,
    isConnected: false,
    lastUpdate: null,
  });

  useEffect(() => {
    if (!matchId) return;

    let inningsChannel: RealtimeChannel;
    let matchChannel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // Subscribe to innings changes
      inningsChannel = supabase
        .channel(`innings-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'innings',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            console.log('Innings update:', payload);
            if (payload.new && typeof payload.new === 'object') {
              setState((prev) => ({
                ...prev,
                innings: payload.new as InningsData,
                lastUpdate: new Date(),
              }));
            }
          }
        )
        .subscribe((status) => {
          console.log('Innings subscription status:', status);
          setState((prev) => ({
            ...prev,
            isConnected: status === 'SUBSCRIBED',
          }));
        });

      // Subscribe to match changes
      matchChannel = supabase
        .channel(`match-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `id=eq.${matchId}`,
          },
          (payload) => {
            console.log('Match update:', payload);
            if (payload.new && typeof payload.new === 'object') {
              setState((prev) => ({
                ...prev,
                match: payload.new as MatchData,
                lastUpdate: new Date(),
              }));
            }
          }
        )
        .subscribe();

      // Fetch initial data
      const [inningsResult, matchResult] = await Promise.all([
        supabase
          .from('innings')
          .select('*')
          .eq('match_id', matchId)
          .eq('is_completed', false)
          .order('innings_number', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('matches').select('*').eq('id', matchId).single(),
      ]);

      setState((prev) => ({
        ...prev,
        innings: inningsResult.data,
        match: matchResult.data,
        lastUpdate: new Date(),
      }));
    };

    setupRealtimeSubscription();

    return () => {
      if (inningsChannel) {
        supabase.removeChannel(inningsChannel);
      }
      if (matchChannel) {
        supabase.removeChannel(matchChannel);
      }
    };
  }, [matchId]);

  return state;
};

export const useRealtimeBalls = (inningsId: string | undefined) => {
  const [balls, setBalls] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!inningsId) return;

    // Fetch initial balls
    const fetchBalls = async () => {
      const { data, error } = await supabase
        .from('ball_by_ball')
        .select('*')
        .eq('innings_id', inningsId)
        .order('over_number', { ascending: true })
        .order('ball_number', { ascending: true });

      if (!error && data) {
        setBalls(data);
        setLastUpdate(new Date());
      }
    };

    fetchBalls();

    // Subscribe to ball changes
    const channel = supabase
      .channel(`balls-${inningsId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ball_by_ball',
          filter: `innings_id=eq.${inningsId}`,
        },
        (payload) => {
          console.log('Ball update:', payload);
          if (payload.eventType === 'INSERT') {
            setBalls((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setBalls((prev) => prev.filter((b) => b.id !== payload.old?.id));
          } else if (payload.eventType === 'UPDATE') {
            setBalls((prev) =>
              prev.map((b) => (b.id === payload.new?.id ? payload.new : b))
            );
          }
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inningsId]);

  return { balls, lastUpdate };
};
