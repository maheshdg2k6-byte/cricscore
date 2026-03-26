import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Player {
  id: string;
  player_name: string;
  is_captain?: boolean | null;
  is_wicket_keeper?: boolean | null;
}

interface PlayerSelectorProps {
  label: string;
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

const PlayerSelector: React.FC<PlayerSelectorProps> = ({
  label,
  players,
  selectedId,
  onSelect,
  disabled = false,
}) => {
  const selectedPlayer = players.find(p => p.id === selectedId);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Select
        value={selectedId || undefined}
        onValueChange={onSelect}
        disabled={disabled}
      >
        <SelectTrigger className="h-11 rounded-lg">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`}>
            {selectedPlayer && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                  {selectedPlayer.player_name.charAt(0)}
                </div>
                <span className="text-sm">{selectedPlayer.player_name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50">
          {players.map((player) => (
            <SelectItem key={player.id} value={player.id} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                  {player.player_name.charAt(0)}
                </div>
                <span>{player.player_name}</span>
                {player.is_captain && (
                  <span className="text-xs text-primary font-medium">(C)</span>
                )}
                {player.is_wicket_keeper && (
                  <span className="text-xs text-muted-foreground font-medium">(WK)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PlayerSelector;
