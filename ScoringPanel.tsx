import React, { useState } from 'react';
import { Undo2, RotateCcw, CircleDot, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import WicketModal from './WicketModal';

interface ScoringPanelProps {
  onDeliverBall: (data: {
    runs: number;
    isWide: boolean;
    isNoBall: boolean;
    isBye: boolean;
    isLegBye: boolean;
    isWicket: boolean;
    dismissalType?: string;
    fielderId?: string;
  }) => void;
  onUndo: () => void;
  onEndOver: () => void;
  disabled?: boolean;
  fieldingPlayers?: { id: string; player_name: string }[];
}

const ScoringPanel: React.FC<ScoringPanelProps> = ({
  onDeliverBall,
  onUndo,
  onEndOver,
  disabled = false,
  fieldingPlayers = [],
}) => {
  const [showExtras, setShowExtras] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showCustomRuns, setShowCustomRuns] = useState(false);
  const [customRunsValue, setCustomRunsValue] = useState('');
  const [wicketContext, setWicketContext] = useState<{ isWide: boolean; isNoBall: boolean }>({ isWide: false, isNoBall: false });

  const handleRunClick = (runs: number) => {
    onDeliverBall({ runs, isWide: false, isNoBall: false, isBye: false, isLegBye: false, isWicket: false });
  };

  const handleCustomRuns = () => {
    const runs = parseInt(customRunsValue, 10);
    if (isNaN(runs) || runs < 0) return;
    handleRunClick(runs);
    setCustomRunsValue('');
    setShowCustomRuns(false);
  };

  const handleWide = (extraRuns: number = 0) => {
    onDeliverBall({ runs: extraRuns, isWide: true, isNoBall: false, isBye: false, isLegBye: false, isWicket: false });
  };

  const handleNoBall = (extraRuns: number = 0) => {
    onDeliverBall({ runs: extraRuns, isWide: false, isNoBall: true, isBye: false, isLegBye: false, isWicket: false });
  };

  const handleBye = (runs: number) => {
    onDeliverBall({ runs, isWide: false, isNoBall: false, isBye: true, isLegBye: false, isWicket: false });
  };

  const handleLegBye = (runs: number) => {
    onDeliverBall({ runs, isWide: false, isNoBall: false, isBye: false, isLegBye: true, isWicket: false });
  };

  const openWicket = (isWide = false, isNoBall = false) => {
    setWicketContext({ isWide, isNoBall });
    setShowWicketModal(true);
  };

  const handleWicket = (dismissalType: string, fielderId?: string) => {
    onDeliverBall({
      runs: 0,
      isWide: wicketContext.isWide,
      isNoBall: wicketContext.isNoBall,
      isBye: false,
      isLegBye: false,
      isWicket: true,
      dismissalType,
      fielderId,
    });
    setWicketContext({ isWide: false, isNoBall: false });
    setShowWicketModal(false);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Run Buttons */}
        <div className="grid grid-cols-4 gap-2.5">
          {[0, 1, 2, 3].map((runs) => (
            <button key={runs} onClick={() => handleRunClick(runs)} disabled={disabled} className="score-btn-run h-14 text-xl font-bold disabled:opacity-50">
              {runs}
            </button>
          ))}
        </div>

        {/* Boundaries + Custom */}
        <div className="grid grid-cols-3 gap-2.5">
          <button onClick={() => handleRunClick(4)} disabled={disabled} className="score-btn-boundary h-13 disabled:opacity-50">
            <span className="text-xl mr-1">4</span><span className="text-xs opacity-90">FOUR</span>
          </button>
          <button onClick={() => handleRunClick(6)} disabled={disabled} className="score-btn-six h-13 disabled:opacity-50">
            <span className="text-xl mr-1">6</span><span className="text-xs opacity-90">SIX</span>
          </button>
          <button onClick={() => setShowCustomRuns(!showCustomRuns)} disabled={disabled} className="score-btn-run h-13 disabled:opacity-50">
            <Plus className="w-4 h-4 mr-1" /><span className="text-xs">Custom</span>
          </button>
        </div>

        {showCustomRuns && (
          <div className="flex gap-2">
            <Input type="number" min={0} max={99} placeholder="Enter runs" value={customRunsValue} onChange={(e) => setCustomRunsValue(e.target.value)} className="h-12 text-center text-lg" onKeyDown={(e) => { if (e.key === 'Enter') handleCustomRuns(); }} />
            <Button onClick={handleCustomRuns} disabled={disabled || !customRunsValue} className="h-12 px-6">Add</Button>
          </div>
        )}

        {/* Wicket */}
        <button onClick={() => openWicket()} disabled={disabled} className="score-btn-wicket w-full h-13 disabled:opacity-50">
          <CircleDot className="w-5 h-5 mr-2" /> WICKET
        </button>

        {/* Extras Toggle */}
        <Button variant="outline" onClick={() => setShowExtras(!showExtras)} className="w-full h-11">
          {showExtras ? 'Hide Extras' : 'Show Extras'}
          {showExtras ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
        </Button>

        {showExtras && (
          <div className="space-y-3 bg-secondary/50 rounded-xl p-3">
            {/* Wide */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Wide (+1 penalty)</p>
              <div className="grid grid-cols-4 gap-1.5">
                <button onClick={() => handleWide(0)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">Wd</button>
                <button onClick={() => handleWide(1)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">Wd+1</button>
                <button onClick={() => handleWide(2)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">Wd+2</button>
                <button onClick={() => handleWide(4)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">Wd+4</button>
              </div>
            </div>

            {/* No Ball */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">No Ball (+1 penalty)</p>
              <div className="grid grid-cols-4 gap-1.5">
                <button onClick={() => handleNoBall(0)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">NB</button>
                <button onClick={() => handleNoBall(1)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">NB+1</button>
                <button onClick={() => handleNoBall(2)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">NB+2</button>
                <button onClick={() => handleNoBall(4)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">NB+4</button>
              </div>
            </div>

            {/* Byes */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Bye (runs to team, not batter)</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((r) => (
                  <button key={r} onClick={() => handleBye(r)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">{r}B</button>
                ))}
              </div>
            </div>

            {/* Leg Byes */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Leg Bye</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((r) => (
                  <button key={r} onClick={() => handleLegBye(r)} disabled={disabled} className="score-btn-extra h-10 text-xs disabled:opacity-50">{r}LB</button>
                ))}
              </div>
            </div>

            {/* Special Dismissals */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Special Dismissals</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => openWicket(true, false)} disabled={disabled} className="score-btn-wicket h-10 text-xs disabled:opacity-50">
                  Wide + Stumped
                </button>
                <button onClick={() => openWicket(false, true)} disabled={disabled} className="score-btn-wicket h-10 text-xs disabled:opacity-50">
                  NB + Run Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Button variant="outline" onClick={onUndo} disabled={disabled} className="h-12">
            <Undo2 className="w-4 h-4 mr-2" /> Undo
          </Button>
          <Button variant="secondary" onClick={onEndOver} disabled={disabled} className="h-12">
            <RotateCcw className="w-4 h-4 mr-2" /> End Over
          </Button>
        </div>
      </div>

      <WicketModal
        open={showWicketModal}
        onClose={() => setShowWicketModal(false)}
        onConfirm={handleWicket}
        context={wicketContext}
        fieldingPlayers={fieldingPlayers}
      />
    </>
  );
};

export default ScoringPanel;
