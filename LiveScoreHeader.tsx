import React from 'react';

interface LiveScoreHeaderProps {
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  target?: number;
  currentBatter: string;
  currentBatterRuns: number;
  currentBatterBalls: number;
  currentBowler: string;
  currentBowlerOvers: string;
  currentBowlerRuns: number;
  currentBowlerWickets: number;
  isRealtime?: boolean;
}

const LiveScoreHeader: React.FC<LiveScoreHeaderProps> = ({
  battingTeam,
  runs,
  wickets,
  overs,
  balls,
  target,
  currentBatter,
  currentBatterRuns,
  currentBatterBalls,
  currentBowler,
  currentBowlerOvers,
  currentBowlerRuns,
  currentBowlerWickets,
  isRealtime = false,
}) => {
  const oversDisplay = `${overs}.${balls}`;
  const runRate = overs > 0 ? (runs / (overs + balls / 6)).toFixed(2) : '0.00';

  return (
    <div className="rounded-xl bg-primary text-primary-foreground p-5">
      {/* Realtime indicator */}
      {isRealtime && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium opacity-80">LIVE</span>
        </div>
      )}

      {/* Main Score */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-medium opacity-90 mb-1">{battingTeam}</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold score-display">{runs}/{wickets}</span>
            <span className="text-lg opacity-75">({oversDisplay})</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70">CRR</div>
          <div className="text-xl font-bold">{runRate}</div>
        </div>
      </div>

      {/* Target info */}
      {target && (
        <div className="bg-primary-foreground/10 rounded-lg px-4 py-2 mb-4">
          <span className="text-sm">
            Need <span className="font-bold">{target - runs}</span> runs from{' '}
            <span className="font-bold">{Math.floor((20 - overs) * 6 - balls)}</span> balls
          </span>
        </div>
      )}

      {/* Current Players */}
      <div className="grid grid-cols-2 gap-3">
        {/* Batter */}
        <div className="bg-primary-foreground/10 rounded-lg px-3 py-2">
          <div className="text-xs opacity-70 mb-1">On Strike</div>
          <div className="font-medium text-sm truncate">{currentBatter}</div>
          <div className="font-bold">
            {currentBatterRuns} <span className="text-xs opacity-70">({currentBatterBalls})</span>
          </div>
        </div>

        {/* Bowler */}
        <div className="bg-primary-foreground/10 rounded-lg px-3 py-2">
          <div className="text-xs opacity-70 mb-1">Bowling</div>
          <div className="font-medium text-sm truncate">{currentBowler}</div>
          <div className="font-bold">
            {currentBowlerWickets}/{currentBowlerRuns}{' '}
            <span className="text-xs opacity-70">({currentBowlerOvers})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveScoreHeader;
