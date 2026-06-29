import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../contexts/AuthContext";
import { previewInvitation } from "../lib/api";
import type { InvitationPreview } from "../types/platform";

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { acceptInvite, hasSession, isAuthenticated, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  useEffect(() => {
    if (!token) return;
    previewInvitation(token)
      .then((row) => {
        setPreview(row);
        setEmail(row.email);
      })
      .catch((e) => setPreviewError(e instanceof Error ? e.message : "Invalid invitation"));
  }, [token]);

  if (!token) {
    return <Navigate to="/signup" replace />;
  }

  if (!loading && isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  async function handleAccept() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await acceptInvite(token);
      navigate("/welcome", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      await handleAccept();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setSubmitting(false);
    }
  }

  if (previewError) {
    return (
      <AuthLayout title="Invitation invalid" subtitle={previewError}>
        <Link to="/signup" className="text-indigo-600 hover:underline">
          Create an account
        </Link>
      </AuthLayout>
    );
  }

  if (!preview) {
    return (
      <AuthLayout title="Loading invitation…" subtitle="Please wait">
        <p className="text-sm text-slate-500">Validating your invite link.</p>
      </AuthLayout>
    );
  }

  if (hasSession && !isAuthenticated) {
    return (
      <AuthLayout
        title={`Join ${preview.workspace_name}`}
        subtitle={`You've been invited as ${preview.role.replace("_", " ")}.`}
      >
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        <button
          type="button"
          disabled={submitting}
          onClick={handleAccept}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Joining…" : "Accept invitation"}
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={`Join ${preview.workspace_name}`}
      subtitle={`Sign ${mode === "signup" ? "up" : "in"} to accept your invitation.`}
    >
      <form onSubmit={handleAuthSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Work email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Password</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? "Joining workspace…" : "Accept invitation"}
        </button>
      </form>
      <button
        type="button"
        className="mt-4 w-full text-sm text-indigo-600 hover:underline"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup" ? "Already have an account? Sign in" : "Need an account? Sign up"}
      </button>
    </AuthLayout>
  );
}
