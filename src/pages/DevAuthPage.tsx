import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { checkHealth, getMe } from "../lib/api";
import { defaultTenantId, roleLabel, type DevRole } from "../lib/auth";
import { isSupabaseAuth } from "../lib/config";
import { supabaseAuthIssuer } from "../lib/supabase";

export function DevAuthPage() {
  const { tenantId, role, setDevAuth, authHeaders, mode } = useAuth();
  const [draftTenant, setDraftTenant] = useState(tenantId || defaultTenantId());
  const [draftRole, setDraftRole] = useState<DevRole>(role);
  const [apiStatus, setApiStatus] = useState("checking…");
  const [me, setMe] = useState("");

  useEffect(() => {
    checkHealth()
      .then((h) => setApiStatus(h.status))
      .catch(() => setApiStatus("unreachable"));
    getMe(authHeaders)
      .then((m) => setMe(`${m.auth_mode} · ${m.role} · ${m.subject}`))
      .catch((e) => setMe(e instanceof Error ? e.message : "error"));
  }, [authHeaders]);

  if (isSupabaseAuth()) {
    return (
      <div className="space-y-4 text-sm text-slate-600">
        <h1 className="text-2xl font-semibold text-slate-900">Session</h1>
        <p>Auth mode: Supabase JWT</p>
        <p>
          <span className="text-slate-400">GET /v1/me:</span> {me}
        </p>
        <p>
          Membership issuer for seed script:{" "}
          <code className="rounded bg-slate-100 px-1">{supabaseAuthIssuer()}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dev authentication</h1>
        <p className="mt-1 text-sm text-slate-500">
          Phase 4a — <code className="rounded bg-slate-100 px-1">X-Tenant-ID</code> +{" "}
          <code className="rounded bg-slate-100 px-1">X-Role</code>
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm space-y-2">
        <p>
          <span className="text-slate-400">Mode:</span> {mode}
        </p>
        <p>
          <span className="text-slate-400">API health:</span> {apiStatus}
        </p>
        <p>
          <span className="text-slate-400">GET /v1/me:</span> {me}
        </p>
      </div>

      <form
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          setDevAuth(draftTenant.trim(), draftRole);
        }}
      >
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Tenant ID</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            value={draftTenant}
            onChange={(e) => setDraftTenant(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Role</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={draftRole}
            onChange={(e) => setDraftRole(e.target.value as DevRole)}
          >
            <option value="tenant_admin">{roleLabel("tenant_admin")}</option>
            <option value="viewer">{roleLabel("viewer")}</option>
            <option value="super_admin">{roleLabel("super_admin")}</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Save session
        </button>
      </form>
    </div>
  );
}
