import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseAuth } from "../lib/config";

export function SignupPage() {
  const { signUp, hasSession, isAuthenticated, loading, needsWorkspace } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseAuth()) {
    return <Navigate to="/" replace />;
  }

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!loading && hasSession && needsWorkspace) {
    return <Navigate to="/create-workspace" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!terms) {
      setError("Please accept the Terms of Service and Privacy Policy");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { needsEmailConfirm } = await signUp(email.trim(), password);
      if (needsEmailConfirm) {
        sessionStorage.setItem("drantiq_pending_email", email.trim());
        navigate("/signup/verify");
      } else {
        navigate("/create-workspace");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start securing your cloud in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Work email</span>
          <input
            type="email"
            autoComplete="email"
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
          <span className="mt-1 block text-xs text-slate-400">At least 8 characters</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the Terms of Service and Privacy Policy
          </span>
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Continue"}
        </button>
      </form>
    </AuthLayout>
  );
}
