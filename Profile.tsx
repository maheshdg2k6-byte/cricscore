import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, HelpCircle, ChevronRight, Sun, Moon, Monitor, Phone, Mail, Send, X, Loader2, Camera, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [playingRole, setPlayingRole] = useState('');
  const [battingStyle, setBattingStyle] = useState('');
  const [bowlingStyle, setBowlingStyle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);

  const signedUpWithPhone = !!user?.phone && !user?.email;
  const signedUpWithEmail = !!user?.email;
  const missingPhone = signedUpWithEmail && !phone;
  const missingEmail = signedUpWithPhone;

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('phone, playing_role, batting_style, bowling_style, avatar_url')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            if (data.phone) setPhone(data.phone);
            if (data.playing_role) setPlayingRole(data.playing_role);
            if (data.batting_style) setBattingStyle(data.batting_style);
            if (data.bowling_style) setBowlingStyle(data.bowling_style);
            if (data.avatar_url) setAvatarUrl(data.avatar_url);
          }
        });
      if (user.email) setEmail(user.email);
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
      setAvatarUrl(url);
      toast({ title: 'Avatar updated!' });
    } catch (err: unknown) {
      toast({ title: 'Upload failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          phone: phone.trim() || null,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player',
          playing_role: playingRole || null,
          batting_style: battingStyle || null,
          bowling_style: bowlingStyle || null,
        }, { onConflict: 'user_id' });
      if (error) throw error;
      toast({ title: 'Profile updated' });
      setEditingProfile(false);
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendSupport = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      toast({ title: 'Please fill in subject and message', variant: 'destructive' });
      return;
    }
    setSendingSupport(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        user_id: user?.id, email: user?.email || null,
        subject: supportSubject.trim(), message: supportMessage.trim(),
      });
      if (error) throw error;
      toast({ title: 'Message sent!', description: "We'll get back to you soon." });
      setSupportOpen(false); setSupportSubject(''); setSupportMessage('');
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSendingSupport(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'Signed out successfully' });
    } catch {
      toast({ title: 'Signed out' });
    }
    navigate('/');
  };

  if (!user) {
    return (
      <MobileLayout>
        <PageHeader title="Profile" />
        <div className="flex flex-col items-center justify-center p-8 mt-12">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome!</h2>
          <p className="text-muted-foreground text-center mb-6 text-sm">Sign in to access your profile, stats, and manage your teams.</p>
          <Button onClick={() => navigate('/auth')}>Sign In / Sign Up</Button>
        </div>
      </MobileLayout>
    );
  }

  const roleLabel = (val: string, list: { value: string; label: string }[]) => list.find(r => r.value === val)?.label || val || 'Not set';

  const themeOptions: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <MobileLayout>
      <PageHeader title="Profile" />

      <div className="px-4 py-4 space-y-6">
        {/* Missing info alert */}
        {(missingPhone || missingEmail) && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                {missingPhone ? 'Add your phone number' : 'Add your email address'}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {missingPhone ? 'Add phone so team managers can find and add you.' : 'Add email for account recovery and team invites.'}
              </p>
              <Button variant="link" size="sm" className="px-0 h-auto text-amber-600" onClick={() => setEditingProfile(true)}>
                Update now →
              </Button>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {user.email?.charAt(0).toUpperCase() || user.phone?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md"
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{user.user_metadata?.full_name || 'Player'}</h2>
            <p className="text-sm text-muted-foreground truncate">{user.email || user.phone}</p>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Player Info</h3>
            <button onClick={() => setEditingProfile(!editingProfile)} className="text-xs text-primary font-medium">
              {editingProfile ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editingProfile ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} readOnly className="h-10 bg-secondary/50 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Email cannot be changed here. Contact support.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone Number</Label>
                <Input type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Playing Role</Label>
                <Select value={playingRole} onValueChange={setPlayingRole}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {PLAYING_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
              <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{phone || 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="truncate ml-2">{user.email || 'Not set'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>{roleLabel(playingRole, PLAYING_ROLES)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Batting</span><span>{roleLabel(battingStyle, BATTING_STYLES)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Bowling</span><span>{roleLabel(bowlingStyle, BOWLING_STYLES)}</span></div>
            </div>
          )}
        </div>

        {/* Theme Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Appearance</label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-secondary rounded-lg">
            {themeOptions.map((option) => {
              const isActive = theme === option.value;
              return (
                <button key={option.value} onClick={() => setTheme(option.value)} className={`flex flex-col items-center gap-1.5 py-3 rounded-md transition-colors ${isActive ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  <option.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Help & Support */}
        <div className="space-y-2">
          <button onClick={() => setSupportOpen(true)} className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:bg-secondary/50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><HelpCircle className="w-4 h-4 text-muted-foreground" /></div>
            <span className="flex-1 text-left font-medium text-sm">Help & Support</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sign Out */}
        <Button variant="outline" onClick={handleSignOut} className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>

        <div className="text-center text-xs text-muted-foreground pt-4 pb-8">
          <p>Cricket Scorer v2.0</p>
        </div>
      </div>

      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>Send a Message</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Subject</Label><Input placeholder="What do you need help with?" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} /></div>
            <div className="space-y-2"><Label>Message</Label><Textarea placeholder="Describe your issue or question..." value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} rows={5} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupportOpen(false)} disabled={sendingSupport}>Cancel</Button>
            <Button onClick={handleSendSupport} disabled={sendingSupport}>
              {sendingSupport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default ProfilePage;
