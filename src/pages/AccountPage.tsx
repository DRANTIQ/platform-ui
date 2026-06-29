import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleLabel, userInitials, type DevRole } from "../lib/auth";
import { isSupabaseAuth } from "../lib/config";

export function AccountPage() {
  const { email, role, workspaceName, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseAuth()) {
    return <p className="text-slate-500">Account settings require Supabase auth.</p>;
  }

  async function handlePasswordSubmit(e: FormEvent) {
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
    setMessage(null);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      setMessage("Password updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSubmitting(false);
    }
  }

  const initials = userInitials(email, workspaceName);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Account</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile and security</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-semibold text-white">
            {initials}
          </span>
          <div>
            <p className="font-medium text-slate-900">{email}</p>
            <p className="text-sm text-slate-500">
              {roleLabel(role as DevRole)}
              {workspaceName ? ` · ${workspaceName}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Profile</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{email}</dd>
          </div>
          {workspaceName && (
            <div>
              <dt className="text-slate-500">Workspace</dt>
              <dd className="font-medium text-slate-900">{workspaceName}</dd>
            </div>
          )}
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="font-medium text-slate-900">{roleLabel(role as DevRole)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Change password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Forgot your password?{" "}
          <Link to="/forgot-password" className="text-indigo-600 hover:underline">
            Reset via email
          </Link>
        </p>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">New password</span>
            <input
              type="password"
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
          {message && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
          )}
          <button
            type="submit"
            disabled={submitting || !password}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
