import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface WicketModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onConfirm?: (type: string, fielderId?: string) => void;
  onSelectDismissal?: (type: string, fielderId?: string) => void;
  context?: { isWide: boolean; isNoBall: boolean };
  fieldingPlayers?: { id: string; player_name: string }[];
}

const allDismissalTypes = [
  { value: 'bowled', label: 'Bowled', allowOnWide: false, allowOnNoBall: false, needsFielder: false },
  { value: 'caught', label: 'Caught', allowOnWide: false, allowOnNoBall: false, needsFielder: true },
  { value: 'lbw', label: 'LBW', allowOnWide: false, allowOnNoBall: false, needsFielder: false },
  { value: 'run_out', label: 'Run Out', allowOnWide: true, allowOnNoBall: true, needsFielder: true },
  { value: 'stumped', label: 'Stumped', allowOnWide: true, allowOnNoBall: false, needsFielder: true },
  { value: 'hit_wicket', label: 'Hit Wicket', allowOnWide: false, allowOnNoBall: true, needsFielder: false },
  { value: 'retired', label: 'Retired', allowOnWide: false, allowOnNoBall: false, needsFielder: false },
  { value: 'obstructing', label: 'Obstructing', allowOnWide: true, allowOnNoBall: true, needsFielder: false },
];

const WicketModal: React.FC<WicketModalProps> = ({
  open, isOpen, onClose, onConfirm, onSelectDismissal, context, fieldingPlayers = [],
}) => {
  const isModalOpen = open ?? isOpen ?? false;
  const handleSelect = onConfirm ?? onSelectDismissal ?? (() => {});
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [fielderId, setFielderId] = useState<string>('');

  const isWide = context?.isWide ?? false;
  const isNoBall = context?.isNoBall ?? false;

  const dismissalTypes = isWide
    ? allDismissalTypes.filter(d => d.allowOnWide)
    : isNoBall
    ? allDismissalTypes.filter(d => d.allowOnNoBall)
    : allDismissalTypes;

  const contextLabel = isWide ? ' (on Wide)' : isNoBall ? ' (on No Ball)' : '';
  const currentType = dismissalTypes.find(d => d.value === selectedType);
  const needsFielder = currentType?.needsFielder && fieldingPlayers.length > 0;

  const handleDismissalSelect = (type: string) => {
    const t = dismissalTypes.find(d => d.value === type);
    if (t?.needsFielder && fieldingPlayers.length > 0) {
      setSelectedType(type);
      setFielderId('');
    } else {
      handleSelect(type, undefined);
      setSelectedType(null);
      setFielderId('');
    }
  };

  const handleConfirm = () => {
    if (selectedType) {
      handleSelect(selectedType, fielderId || undefined);
      setSelectedType(null);
      setFielderId('');
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setFielderId('');
    onClose();
  };

  if (!isModalOpen) return null;

  const fielderLabel = selectedType === 'caught' ? 'Who caught?' :
    selectedType === 'stumped' ? 'Stumped by (WK)' :
    selectedType === 'run_out' ? 'Run out by (fielder)' : 'Fielder';

  return (
    <>
      <div onClick={handleClose} className="fixed inset-0 bg-black/50 z-50" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border p-6 pb-safe">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Dismissal Type{contextLabel}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedType ? `Selected: ${currentType?.label}` : 'How was the batter out?'}
            </p>
          </div>
          <button onClick={handleClose} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!selectedType ? (
          <div className="grid grid-cols-2 gap-2">
            {dismissalTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleDismissalSelect(type.value)}
                className="px-4 py-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium text-sm transition-colors text-left"
              >
                {type.label}
                {type.needsFielder && <span className="text-xs text-muted-foreground block">+ fielder</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">{fielderLabel}</Label>
              <Select value={fielderId} onValueChange={setFielderId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={`Select ${fielderLabel.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent className="bg-card z-[60]">
                  {fieldingPlayers.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.player_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedType(null)} className="flex-1">Back</Button>
              <Button onClick={handleConfirm} className="flex-1">Confirm Wicket</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WicketModal;
