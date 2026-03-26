import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/hooks/useTheme";

import HomePage from "./pages/Home";
import AuthPage from "./pages/Auth";
import ResetPasswordPage from "./pages/ResetPassword";
import MatchesPage from "./pages/Matches";
import CreateMatchPage from "./pages/CreateMatch";
import MatchDetailPage from "./pages/MatchDetail";
import ScoringPage from "./pages/Scoring";
import TeamsPage from "./pages/Teams";
import CreateTeamPage from "./pages/CreateTeam";
import TeamDetailPage from "./pages/TeamDetail";
import TournamentsPage from "./pages/Tournaments";
import CreateTournamentPage from "./pages/CreateTournament";
import TournamentDetailPage from "./pages/TournamentDetail";
import StatsPage from "./pages/Stats";
import ProfilePage from "./pages/Profile";
import PlayerProfilePage from "./pages/PlayerProfile";
import EmailTemplatesPage from "./pages/EmailTemplates";
import SearchPage from "./pages/Search";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/matches/create" element={<CreateMatchPage />} />
              <Route path="/match/:id" element={<MatchDetailPage />} />
              <Route path="/match/:id/score" element={<ScoringPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/teams/create" element={<CreateTeamPage />} />
              <Route path="/teams/:id" element={<TeamDetailPage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/create" element={<CreateTournamentPage />} />
              <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:userId" element={<PlayerProfilePage />} />
              <Route path="/email-templates" element={<EmailTemplatesPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
