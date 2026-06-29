import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { welcomePathForState } from "../../lib/onboarding";
import { isSupabaseAuth } from "../../lib/config";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireOnboarding?: boolean;
};

const PUBLIC_PATHS = new Set([
  "/login",
  "/signup",
  "/signup/verify",
  "/create-workspace",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]);

export function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const {
    loading,
    hasSession,
    isAuthenticated,
    needsWorkspace,
    onboardingComplete,
    onboardingState,
  } = useAuth();
  const location = useLocation();
  const onWelcome = location.pathname.startsWith("/welcome");

  if (!isSupabaseAuth()) {
    return children;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading session…
      </div>
    );
  }

  if (!hasSession && !PUBLIC_PATHS.has(location.pathname)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (hasSession && needsWorkspace && location.pathname !== "/create-workspace") {
    return <Navigate to="/create-workspace" replace />;
  }

  if (!isAuthenticated && !PUBLIC_PATHS.has(location.pathname)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (isAuthenticated && requireOnboarding && !onboardingComplete && !onWelcome) {
    return <Navigate to={welcomePathForState(onboardingState)} replace />;
  }

  if (isAuthenticated && !requireOnboarding && onboardingComplete && onWelcome) {
    return <Navigate to="/" replace />;
  }

  return children;
}
