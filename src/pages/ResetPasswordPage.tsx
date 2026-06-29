import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../contexts/AuthContext";
import { clearAuthHashFromUrl } from "../lib/authRedirect";
import { isSupabaseAuth } from "../lib/config";

export function ResetPasswordPage() {
  const { loading, hasSession, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && hasSession) {
      clearAuthHashFromUrl();
    }
  }, [loading, hasSession]);

  if (!isSupabaseAuth()) {
    return null;
  }

  if (!loading && !hasSession) {
    return (
      <AuthLayout title="Link expired" subtitle="Request a new password reset link.">
        <Link to="/forgot-password" className="font-medium text-indigo-600 hover:underline">
          Reset password
        </Link>
      </AuthLayout>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Verifying reset link…
      </div>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="Redirecting you to your dashboard…">
        <p className="text-sm text-slate-600">You can now use your new password to sign in.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter a strong password for your Drantiq account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">New password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Confirm password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}
