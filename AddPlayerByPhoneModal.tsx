import React, { useState } from 'react';
import { Phone, Loader2, UserPlus, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface AddPlayerByPhoneModalProps {
  teamId: string;
  open: boolean;
  onClose: () => void;
  onPlayerAdded: () => void;
}

const PLAYING_ROLES = [
  { value: 'batsman', label: 'Batsman' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'allrounder', label: 'All-Rounder' },
  { value: 'wk_batsman', label: 'WK-Batsman' },
];
const BATTING_STYLES = [
  { value: 'right_hand', label: 'Right Hand Bat' },
  { value: 'left_hand', label: 'Left Hand Bat' },
];
const BOWLING_STYLES = [
  { value: 'right_arm_fast', label: 'Right Arm Fast' },
  { value: 'right_arm_medium', label: 'Right Arm Medium' },
  { value: 'left_arm_fast', label: 'Left Arm Fast' },
  { value: 'left_arm_medium', label: 'Left Arm Medium' },
  { value: 'right_arm_off_spin', label: 'Right Arm Off Spin' },
  { value: 'right_arm_leg_spin', label: 'Right Arm Leg Spin' },
  { value: 'left_arm_spin', label: 'Left Arm Spin' },
  { value: 'left_arm_chinaman', label: 'Left Arm Chinaman' },
];

const AddPlayerByPhoneModal: React.FC<AddPlayerByPhoneModalProps> = ({
  teamId, open, onClose, onPlayerAdded,
}) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isCaptain, setIsCaptain] = useState(false);
  const [isViceCaptain, setIsViceCaptain] = useState(false);
  const [isWicketKeeper, setIsWicketKeeper] = useState(false);
  const [playingRole, setPlayingRole] = useState('');
  const [battingStyle, setBattingStyle] = useState('');
  const [bowlingStyle, setBowlingStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'phone' | 'email' | 'manual'>('manual');

  const handleLookup = async () => {
    const searchPhone = mode === 'phone' ? phone.trim() : '';
    const searchEmail = mode === 'email' ? email.trim() : '';
    if (!searchPhone && !searchEmail) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lookup-player-by-phone', {
        body: { phone: searchPhone || undefined, email: searchEmail || undefined, team_id: teamId },
      });
      if (error) throw error;
      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      } else if (data.found) {
        toast({ title: 'Player added!', description: `${data.player_name} has been added to your team.` });
        onPlayerAdded();
        handleClose();
      } else {
        toast({ title: 'No user found', description: data.message || 'No registered user found. Try adding manually.' });
        setMode('manual');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to look up player. Check the search value and try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!playerName.trim()) return;
    setLoading(true);
    try {
      const insertData: any = {
        team_id: teamId,
        player_name: playerName.trim(),
        is_captain: isCaptain,
        is_vice_captain: isViceCaptain,
        is_wicket_keeper: isWicketKeeper,
      };
      if (playingRole) insertData.playing_role = playingRole;
      if (battingStyle) insertData.batting_style = battingStyle;
      if (bowlingStyle) insertData.bowling_style = bowlingStyle;

      const { error } = await supabase.from('team_members').insert(insertData);
      if (error) throw error;

      toast({ title: 'Player added!', description: `${playerName.trim()} has been added to your team.` });
      onPlayerAdded();
      handleClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to add player.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhone(''); setEmail(''); setPlayerName('');
    setIsCaptain(false); setIsViceCaptain(false); setIsWicketKeeper(false);
    setPlayingRole(''); setBattingStyle(''); setBowlingStyle('');
    setMode('manual');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex mb-4 bg-secondary rounded-xl p-1">
          <button type="button" onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <UserPlus className="w-4 h-4 inline mr-1" /> Manual
          </button>
          <button type="button" onClick={() => setMode('phone')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'phone' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <Phone className="w-4 h-4 inline mr-1" /> Phone
          </button>
          <button type="button" onClick={() => setMode('email')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'email' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            <Mail className="w-4 h-4 inline mr-1" /> Email
          </button>
        </div>

        {mode === 'phone' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <p className="text-xs text-muted-foreground">Enter the player's registered phone number with country code.</p>
            </div>
            <Button className="w-full" onClick={handleLookup} disabled={loading || !phone.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Look Up & Add
            </Button>
          </div>
        ) : mode === 'email' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="player@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="text-xs text-muted-foreground">Enter the player's registered email address.</p>
            </div>
            <Button className="w-full" onClick={handleLookup} disabled={loading || !email.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Look Up & Add
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Player Name</Label>
              <Input type="text" placeholder="Enter player name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Playing Role</Label>
              <Select value={playingRole} onValueChange={setPlayingRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {PLAYING_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Batting Style</Label>
                <Select value={battingStyle} onValueChange={setBattingStyle}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {BATTING_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Bowling Style</Label>
                <Select value={bowlingStyle} onValueChange={setBowlingStyle}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {BOWLING_STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm">Team Role</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="captain" checked={isCaptain} onCheckedChange={(v) => { setIsCaptain(!!v); if (v) setIsViceCaptain(false); }} />
                <Label htmlFor="captain" className="text-sm font-normal">Captain</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="viceCaptain" checked={isViceCaptain} onCheckedChange={(v) => { setIsViceCaptain(!!v); if (v) setIsCaptain(false); }} />
                <Label htmlFor="viceCaptain" className="text-sm font-normal">Vice Captain</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="keeper" checked={isWicketKeeper} onCheckedChange={(v) => setIsWicketKeeper(!!v)} />
                <Label htmlFor="keeper" className="text-sm font-normal">Wicket Keeper</Label>
              </div>
            </div>
            <Button className="w-full" onClick={handleManualAdd} disabled={loading || !playerName.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Add Player
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerByPhoneModal;
