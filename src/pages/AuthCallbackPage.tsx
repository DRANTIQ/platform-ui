import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { clearAuthHashFromUrl } from "../lib/authRedirect";
import { welcomePathForState } from "../lib/onboarding";

/**
 * Handles Supabase email-confirmation redirects (#access_token=…).
 * Supabase must allowlist this path in Auth → URL Configuration.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loading, hasSession, needsWorkspace, isAuthenticated, onboardingComplete, onboardingState } =
    useAuth();

  useEffect(() => {
    if (loading) return;

    clearAuthHashFromUrl();

    if (!hasSession) {
      navigate("/login", { replace: true, state: { message: "Email link expired. Please sign in." } });
      return;
    }

    if (needsWorkspace) {
      navigate("/create-workspace", { replace: true });
      return;
    }

    if (isAuthenticated && !onboardingComplete) {
      navigate(welcomePathForState(onboardingState), { replace: true });
      return;
    }

    navigate("/", { replace: true });
  }, [
    loading,
    hasSession,
    needsWorkspace,
    isAuthenticated,
    onboardingComplete,
    onboardingState,
    navigate,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
      Completing sign in…
    </div>
  );
}
