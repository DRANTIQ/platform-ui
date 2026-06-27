import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { isSupabaseAuth } from "../../lib/config";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated, needsProvisioning } = useAuth();
  const location = useLocation();

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

  if (needsProvisioning) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-slate-900">Account not provisioned</h1>
        <p className="mt-2 text-sm text-slate-600">
          Login succeeded but no tenant membership exists. Run{" "}
          <code className="rounded bg-slate-100 px-1">seed_identity_membership.py</code> with your
          Supabase user <code className="rounded bg-slate-100 px-1">sub</code>.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
