import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createInvitation, listInvitations, revokeInvitation } from "../lib/api";
import type { Invitation } from "../types/platform";

export function TeamPage() {
  const { authHeaders, canWrite } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await listInvitations(authHeaders);
    setInvitations(rows);
  }, [authHeaders]);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load invitations"))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setError(null);
    setCreatedUrl(null);
    try {
      const row = await createInvitation(authHeaders, { email: email.trim(), role });
      setCreatedUrl(row.invite_url ?? null);
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invitation");
    }
  }

  async function handleRevoke(id: string) {
    try {
      await revokeInvitation(authHeaders, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invitation");
    }
  }

  if (loading) return <p className="text-slate-500">Loading team…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Team</h1>
        <p className="text-sm text-slate-500">Invite teammates to your workspace</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {canWrite && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-medium text-slate-900">Invite teammate</h2>
          <div className="flex flex-wrap gap-3">
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-[240px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="viewer">Viewer</option>
              <option value="tenant_admin">Admin</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Send invite
            </button>
          </div>
          {createdUrl && (
            <p className="text-sm text-emerald-700">
              Invite link created — share:{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">{createdUrl}</code>
            </p>
          )}
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expires</th>
              {canWrite && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invitations.length === 0 && (
              <tr>
                <td colSpan={canWrite ? 5 : 4} className="px-4 py-8 text-center text-slate-400">
                  No invitations yet
                </td>
              </tr>
            )}
            {invitations.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3">{inv.email}</td>
                <td className="px-4 py-3">{inv.role}</td>
                <td className="px-4 py-3 capitalize">{inv.status}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(inv.expires_at).toLocaleDateString()}</td>
                {canWrite && (
                  <td className="px-4 py-3">
                    {inv.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(inv.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
