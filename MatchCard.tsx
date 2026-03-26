import React from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface MatchCardProps {
  id: string;
  name: string;
  teamA?: Team | null;
  teamB?: Team | null;
  matchDate: string;
  venue?: string | null;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  overs: number;
  scoreA?: { runs: number; wickets: number; overs: number };
  scoreB?: { runs: number; wickets: number; overs: number };
}

const MatchCard: React.FC<MatchCardProps> = ({
  id,
  name,
  teamA,
  teamB,
  matchDate,
  venue,
  status,
  overs,
  scoreA,
  scoreB,
}) => {
  const navigate = useNavigate();
  const date = new Date(matchDate);

  const getStatusBadge = () => {
    switch (status) {
      case 'live':
        return (
          <span className="status-live">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            LIVE
          </span>
        );
      case 'upcoming':
        return <span className="status-upcoming">Upcoming</span>;
      case 'completed':
        return <span className="status-completed">Completed</span>;
      default:
        return <span className="status-completed">{status}</span>;
    }
  };

  return (
    <div
      onClick={() => navigate(`/match/${id}`)}
      className="match-card p-4 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {getStatusBadge()}
        <span className="text-xs text-muted-foreground font-medium">{overs} overs</span>
      </div>

      {/* Teams */}
      <div className="space-y-2.5">
        {/* Team A */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50 flex items-center justify-center text-sm font-bold text-primary">
              {teamA?.name?.charAt(0) || 'A'}
            </div>
            <span className="font-medium text-foreground">
              {teamA?.name || 'Team A'}
            </span>
          </div>
          {scoreA && (
            <div className="text-right">
              <span className="font-bold text-lg score-display text-foreground">
                {scoreA.runs}/{scoreA.wickets}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                ({scoreA.overs})
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="divider-gradient" />

        {/* Team B */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 border border-border/50 flex items-center justify-center text-sm font-bold text-accent">
              {teamB?.name?.charAt(0) || 'B'}
            </div>
            <span className="font-medium text-foreground">
              {teamB?.name || 'Team B'}
            </span>
          </div>
          {scoreB && (
            <div className="text-right">
              <span className="font-bold text-lg score-display text-foreground">
                {scoreB.runs}/{scoreB.wickets}
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">
                ({scoreB.overs})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{format(date, 'MMM d, h:mm a')}</span>
          </div>
          {venue && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[100px]">{venue}</span>
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};

export default MatchCard;
