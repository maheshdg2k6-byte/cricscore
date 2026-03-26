import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Mail, Trophy, Megaphone, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MobileLayout from '@/components/layout/MobileLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

const OWNER_EMAIL = 'maheshdg2k6@gmail.com';

type TemplateType = 'match-summary' | 'tournament-invite' | 'announcement';

interface MatchSummaryData {
  matchTitle: string;
  teamA: string;
  teamB: string;
  scoreA: string;
  scoreB: string;
  venue: string;
  date: string;
  result: string;
  mvp: string;
}

interface TournamentInviteData {
  tournamentName: string;
  startDate: string;
  endDate: string;
  venue: string;
  format: string;
  registrationLink: string;
  contactEmail: string;
}

interface AnnouncementData {
  subject: string;
  heading: string;
  body: string;
  ctaText: string;
  ctaLink: string;
}

const defaultMatchData: MatchSummaryData = {
  matchTitle: 'Super League Final',
  teamA: 'Thunder Hawks',
  teamB: 'Royal Strikers',
  scoreA: '185/4 (20.0)',
  scoreB: '170/8 (20.0)',
  venue: 'Central Stadium',
  date: '2026-02-15',
  result: 'Thunder Hawks won by 15 runs',
  mvp: 'Rahul Sharma (78 off 45)',
};

const defaultInviteData: TournamentInviteData = {
  tournamentName: 'Spring Premier League 2026',
  startDate: '2026-03-01',
  endDate: '2026-03-15',
  venue: 'City Sports Complex',
  format: 'T20',
  registrationLink: 'https://example.com/register',
  contactEmail: 'organizer@example.com',
};

const defaultAnnouncementData: AnnouncementData = {
  subject: 'Important Update',
  heading: 'Season 2026 Registration Open!',
  body: 'We are excited to announce that registration for the 2026 cricket season is now open. Join us for an exciting season of competitive cricket with improved facilities and bigger prizes.',
  ctaText: 'Register Now',
  ctaLink: 'https://example.com/register',
};

const generateMatchSummaryHTML = (data: MatchSummaryData) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#3b5bdb,#4dabf7);padding:32px 24px;text-align:center;">
    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.8);letter-spacing:1px;text-transform:uppercase;">Match Summary</p>
    <h1 style="margin:8px 0 0;font-size:24px;color:#ffffff;font-weight:700;">${data.matchTitle}</h1>
  </td></tr>
  <!-- Scores -->
  <tr><td style="padding:32px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="45%" style="text-align:center;padding:16px;background:#f8f9fa;border-radius:12px;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a2e;">${data.teamA}</p>
          <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#3b5bdb;">${data.scoreA}</p>
        </td>
        <td width="10%" style="text-align:center;font-size:16px;font-weight:700;color:#868e96;">VS</td>
        <td width="45%" style="text-align:center;padding:16px;background:#f8f9fa;border-radius:12px;">
          <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a2e;">${data.teamB}</p>
          <p style="margin:8px 0 0;font-size:28px;font-weight:800;color:#3b5bdb;">${data.scoreB}</p>
        </td>
      </tr>
    </table>
  </td></tr>
  <!-- Result -->
  <tr><td style="padding:0 24px 24px;">
    <div style="background:linear-gradient(135deg,#12b886,#20c997);border-radius:12px;padding:16px;text-align:center;">
      <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff;">🏆 ${data.result}</p>
    </div>
  </td></tr>
  <!-- Details -->
  <tr><td style="padding:0 24px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:12px;padding:16px;">
      <tr><td style="padding:8px 16px;"><span style="color:#868e96;font-size:13px;">📍 Venue</span><br><span style="color:#1a1a2e;font-weight:600;font-size:15px;">${data.venue}</span></td></tr>
      <tr><td style="padding:8px 16px;"><span style="color:#868e96;font-size:13px;">📅 Date</span><br><span style="color:#1a1a2e;font-weight:600;font-size:15px;">${data.date}</span></td></tr>
      <tr><td style="padding:8px 16px;"><span style="color:#868e96;font-size:13px;">⭐ Player of the Match</span><br><span style="color:#1a1a2e;font-weight:600;font-size:15px;">${data.mvp}</span></td></tr>
    </table>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:24px;text-align:center;border-top:1px solid #e9ecef;">
    <p style="margin:0;font-size:12px;color:#adb5bd;">Powered by Cricket Scorer 🏏</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

const generateTournamentInviteHTML = (data: TournamentInviteData) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#7048e8,#9775fa);padding:40px 24px;text-align:center;">
    <p style="margin:0;font-size:48px;">🏆</p>
    <h1 style="margin:16px 0 0;font-size:26px;color:#ffffff;font-weight:700;">You're Invited!</h1>
    <p style="margin:8px 0 0;font-size:16px;color:rgba(255,255,255,0.85);">${data.tournamentName}</p>
  </td></tr>
  <!-- Details -->
  <tr><td style="padding:32px 24px;">
    <h2 style="margin:0 0 20px;font-size:18px;color:#1a1a2e;">Tournament Details</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:8px;margin-bottom:8px;">
        <span style="color:#868e96;font-size:13px;">📅 Dates</span><br>
        <span style="color:#1a1a2e;font-weight:600;">${data.startDate} — ${data.endDate}</span>
      </td></tr>
      <tr><td height="8"></td></tr>
      <tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:8px;">
        <span style="color:#868e96;font-size:13px;">📍 Venue</span><br>
        <span style="color:#1a1a2e;font-weight:600;">${data.venue}</span>
      </td></tr>
      <tr><td height="8"></td></tr>
      <tr><td style="padding:12px 16px;background:#f8f9fa;border-radius:8px;">
        <span style="color:#868e96;font-size:13px;">🏏 Format</span><br>
        <span style="color:#1a1a2e;font-weight:600;">${data.format}</span>
      </td></tr>
    </table>
  </td></tr>
  <!-- CTA -->
  <tr><td style="padding:0 24px 32px;text-align:center;">
    <a href="${data.registrationLink}" style="display:inline-block;background:linear-gradient(135deg,#7048e8,#9775fa);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:16px;">Register Your Team</a>
  </td></tr>
  <!-- Contact -->
  <tr><td style="padding:0 24px 24px;text-align:center;">
    <p style="margin:0;font-size:14px;color:#868e96;">Questions? Contact us at <a href="mailto:${data.contactEmail}" style="color:#7048e8;">${data.contactEmail}</a></p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:24px;text-align:center;border-top:1px solid #e9ecef;">
    <p style="margin:0;font-size:12px;color:#adb5bd;">Powered by Cricket Scorer 🏏</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

const generateAnnouncementHTML = (data: AnnouncementData) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#e8590c,#fd7e14);padding:40px 24px;text-align:center;">
    <p style="margin:0;font-size:48px;">📢</p>
    <h1 style="margin:16px 0 0;font-size:26px;color:#ffffff;font-weight:700;">${data.heading}</h1>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px 24px;">
    <p style="margin:0;font-size:16px;line-height:1.6;color:#495057;">${data.body}</p>
  </td></tr>
  <!-- CTA -->
  <tr><td style="padding:0 24px 32px;text-align:center;">
    <a href="${data.ctaLink}" style="display:inline-block;background:linear-gradient(135deg,#e8590c,#fd7e14);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:700;font-size:16px;">${data.ctaText}</a>
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:24px;text-align:center;border-top:1px solid #e9ecef;">
    <p style="margin:0;font-size:12px;color:#adb5bd;">Powered by Cricket Scorer 🏏</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

const EmailTemplatesPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('match-summary');
  const [copied, setCopied] = useState(false);
  const [matchData, setMatchData] = useState<MatchSummaryData>(defaultMatchData);
  const [inviteData, setInviteData] = useState<TournamentInviteData>(defaultInviteData);
  const [announcementData, setAnnouncementData] = useState<AnnouncementData>(defaultAnnouncementData);

  if (loading) {
    return (
      <MobileLayout>
        <PageHeader title="Email Templates" showBack />
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      </MobileLayout>
    );
  }

  if (!user || user.email !== OWNER_EMAIL) {
    return (
      <MobileLayout>
        <PageHeader title="Access Denied" showBack />
        <div className="p-8 text-center space-y-4">
          <p className="text-muted-foreground">This page is only accessible to the app owner.</p>
          <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </MobileLayout>
    );
  }

  const getHTML = () => {
    switch (activeTemplate) {
      case 'match-summary': return generateMatchSummaryHTML(matchData);
      case 'tournament-invite': return generateTournamentInviteHTML(inviteData);
      case 'announcement': return generateAnnouncementHTML(announcementData);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getHTML());
      setCopied(true);
      toast({ title: 'Copied!', description: 'Email HTML copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Error', description: 'Failed to copy.', variant: 'destructive' });
    }
  };

  return (
    <MobileLayout>
      <PageHeader title="Email Templates" showBack />

      <div className="px-4 pb-24 space-y-4">
        {/* Template selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Tabs value={activeTemplate} onValueChange={(v) => setActiveTemplate(v as TemplateType)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="match-summary" className="text-xs gap-1"><FileText className="w-3.5 h-3.5" />Match</TabsTrigger>
              <TabsTrigger value="tournament-invite" className="text-xs gap-1"><Trophy className="w-3.5 h-3.5" />Invite</TabsTrigger>
              <TabsTrigger value="announcement" className="text-xs gap-1"><Megaphone className="w-3.5 h-3.5" />Announce</TabsTrigger>
            </TabsList>

            {/* Match Summary Form */}
            <TabsContent value="match-summary" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Match Title</Label>
                  <Input value={matchData.matchTitle} onChange={(e) => setMatchData({ ...matchData, matchTitle: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Team A</Label>
                  <Input value={matchData.teamA} onChange={(e) => setMatchData({ ...matchData, teamA: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Team B</Label>
                  <Input value={matchData.teamB} onChange={(e) => setMatchData({ ...matchData, teamB: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Score A</Label>
                  <Input value={matchData.scoreA} onChange={(e) => setMatchData({ ...matchData, scoreA: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Score B</Label>
                  <Input value={matchData.scoreB} onChange={(e) => setMatchData({ ...matchData, scoreB: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Venue</Label>
                  <Input value={matchData.venue} onChange={(e) => setMatchData({ ...matchData, venue: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={matchData.date} onChange={(e) => setMatchData({ ...matchData, date: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Result</Label>
                  <Input value={matchData.result} onChange={(e) => setMatchData({ ...matchData, result: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Player of the Match</Label>
                  <Input value={matchData.mvp} onChange={(e) => setMatchData({ ...matchData, mvp: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            {/* Tournament Invite Form */}
            <TabsContent value="tournament-invite" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Tournament Name</Label>
                  <Input value={inviteData.tournamentName} onChange={(e) => setInviteData({ ...inviteData, tournamentName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={inviteData.startDate} onChange={(e) => setInviteData({ ...inviteData, startDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={inviteData.endDate} onChange={(e) => setInviteData({ ...inviteData, endDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Venue</Label>
                  <Input value={inviteData.venue} onChange={(e) => setInviteData({ ...inviteData, venue: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Format</Label>
                  <Input value={inviteData.format} onChange={(e) => setInviteData({ ...inviteData, format: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Registration Link</Label>
                  <Input value={inviteData.registrationLink} onChange={(e) => setInviteData({ ...inviteData, registrationLink: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Contact Email</Label>
                  <Input type="email" value={inviteData.contactEmail} onChange={(e) => setInviteData({ ...inviteData, contactEmail: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            {/* Announcement Form */}
            <TabsContent value="announcement" className="space-y-3 mt-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Input value={announcementData.subject} onChange={(e) => setAnnouncementData({ ...announcementData, subject: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Heading</Label>
                  <Input value={announcementData.heading} onChange={(e) => setAnnouncementData({ ...announcementData, heading: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Body</Label>
                  <Textarea rows={4} value={announcementData.body} onChange={(e) => setAnnouncementData({ ...announcementData, body: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Button Text</Label>
                    <Input value={announcementData.ctaText} onChange={(e) => setAnnouncementData({ ...announcementData, ctaText: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Button Link</Label>
                    <Input value={announcementData.ctaLink} onChange={(e) => setAnnouncementData({ ...announcementData, ctaLink: e.target.value })} />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={copyToClipboard} className="flex-1 gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy HTML'}
          </Button>
        </div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border overflow-hidden bg-card"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Email Preview</span>
          </div>
          <div className="bg-[#f0f2f5]">
            <iframe
              srcDoc={getHTML()}
              className="w-full border-0"
              style={{ minHeight: 500 }}
              title="Email Preview"
            />
          </div>
        </motion.div>
      </div>
    </MobileLayout>
  );
};

export default EmailTemplatesPage;
