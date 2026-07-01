import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isSupabaseAuth } from "./lib/config";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthHashRedirect } from "./components/auth/AuthHashRedirect";
import { WelcomeLayout } from "./components/welcome/WelcomeLayout";
import { AppShell } from "./components/layout/AppShell";
import { AuthProvider } from "./contexts/AuthContext";
import { EnvironmentScopeProvider } from "./contexts/EnvironmentScopeContext";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { AccountPage } from "./pages/AccountPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { CreateWorkspacePage } from "./pages/CreateWorkspacePage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevAuthPage } from "./pages/DevAuthPage";
import { FindingDetailPage } from "./pages/FindingDetailPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { LoginPage } from "./pages/LoginPage";
import { ScanDetailPage } from "./pages/ScanDetailPage";
import { ScansPage } from "./pages/ScansPage";
import { SignupPage } from "./pages/SignupPage";
import { SignupVerifyPage } from "./pages/SignupVerifyPage";
import { TeamPage } from "./pages/TeamPage";
import { ConnectAwsPage } from "./pages/welcome/ConnectAwsPage";
import { ConnectAzurePage } from "./pages/welcome/ConnectAzurePage";
import { ScanProgressPage } from "./pages/welcome/ScanProgressPage";
import { ScanResultsPage } from "./pages/welcome/ScanResultsPage";
import { WelcomePage } from "./pages/welcome/WelcomePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthHashRedirect />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/me" element={<Navigate to="/login" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/verify" element={<SignupVerifyPage />} />
          <Route path="/create-workspace" element={<CreateWorkspacePage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />

          <Route
            element={
              <ProtectedRoute requireOnboarding={false}>
                <WelcomeLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/welcome/connect-aws" element={<ConnectAwsPage />} />
            <Route path="/welcome/connect-azure" element={<ConnectAzurePage />} />
            <Route path="/welcome/scan" element={<ScanProgressPage />} />
            <Route path="/welcome/results" element={<ScanResultsPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute requireOnboarding>
                <EnvironmentScopeProvider>
                  <AppShell />
                </EnvironmentScopeProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="scans" element={<ScansPage />} />
            <Route path="scans/:scanId" element={<ScanDetailPage />} />
            <Route path="scans/:scanId/findings/:findingId" element={<FindingDetailPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="account" element={<AccountPage />} />
            {!isSupabaseAuth() && <Route path="dev" element={<DevAuthPage />} />}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
