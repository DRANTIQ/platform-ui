import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseAuth } from "../lib/config";

export function CreateWorkspacePage() {
  const { createWorkspace, hasSession, isAuthenticated, loading, onboardingComplete } = useAuth();
  const navigate = useNavigate();
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseAuth()) {
    return <Navigate to="/" replace />;
  }

  if (!loading && !hasSession) {
    return <Navigate to="/signup" replace />;
  }

  if (!loading && isAuthenticated) {
    return <Navigate to={onboardingComplete ? "/" : "/welcome"} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createWorkspace(workspaceName);
      navigate("/welcome", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="This is where your team will manage cloud security."
      footer={
        <>
          Wrong account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Workspace name</span>
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            placeholder="Acme Security"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Creating workspace…" : "Create workspace"}
        </button>
      </form>
    </AuthLayout>
  );
}
