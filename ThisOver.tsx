import React from 'react';

interface Ball {
  id?: string;
  runs: number;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isWicket: boolean;
}

interface ThisOverProps {
  balls: Ball[];
  overNumber: number;
}

const ThisOver: React.FC<ThisOverProps> = ({ balls, overNumber }) => {
  const getBallDisplay = (ball: Ball) => {
    if (ball.isWicket) return { text: 'W', className: 'bg-destructive text-destructive-foreground' };
    if (ball.isWide) return { text: `${ball.runs}wd`, className: 'bg-secondary text-secondary-foreground' };
    if (ball.isNoBall) return { text: `${ball.runs}nb`, className: 'bg-secondary text-secondary-foreground' };
    if (ball.isBye) return { text: `${ball.runs}b`, className: 'bg-secondary text-secondary-foreground' };
    if (ball.isLegBye) return { text: `${ball.runs}lb`, className: 'bg-secondary text-secondary-foreground' };
    if (ball.runs === 4) return { text: '4', className: 'bg-amber-500 text-white' };
    if (ball.runs === 6) return { text: '6', className: 'bg-purple-500 text-white' };
    if (ball.runs === 0) return { text: '•', className: 'bg-muted text-muted-foreground' };
    return { text: ball.runs.toString(), className: 'bg-primary/10 text-primary border border-primary/20' };
  };

  const legalBalls = balls.filter(b => !b.isWide && !b.isNoBall).length;

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Over {overNumber + 1}</h3>
        <span className="text-xs text-muted-foreground">{legalBalls}/6 balls</span>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {balls.length === 0 ? (
          <span className="text-sm text-muted-foreground">No balls yet</span>
        ) : (
          balls.map((ball, index) => {
            const display = getBallDisplay(ball);
            return (
              <div
                key={ball.id || index}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold ${display.className}`}
              >
                {display.text}
              </div>
            );
          })
        )}
        
        {/* Empty slots */}
        {Array.from({ length: Math.max(0, 6 - legalBalls) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-9 h-9 rounded-lg border border-dashed border-border flex items-center justify-center"
          >
            <span className="text-muted-foreground/40">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThisOver;
