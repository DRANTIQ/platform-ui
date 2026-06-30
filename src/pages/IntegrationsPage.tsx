import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ConnectAwsForm } from "../components/integrations/ConnectAwsForm";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import { listIntegrations } from "../lib/api";
import { formatDate } from "../lib/format";
import { copy } from "../lib/productCopy";
import type { Integration } from "../types/platform";

export function IntegrationsPage() {
  const { authHeaders, canWrite } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const refresh = useCallback(async () => {
    const rows = await listIntegrations(authHeaders);
    setIntegrations(rows);
  }, [authHeaders]);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load integrations"))
      .finally(() => setLoading(false));
  }, [refresh]);

  function openForm() {
    setFormKey((k) => k + 1);
    setShowForm(true);
    setError(null);
  }

  async function handleConnected() {
    setShowForm(false);
    await refresh();
  }

  if (loading) return <p className="text-slate-500">Loading integrations…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Integrations</h1>
          <p className="text-sm text-slate-500">Connect AWS accounts for {copy.productName.toLowerCase()}</p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => (showForm ? setShowForm(false) : openForm())}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? "Cancel" : "Add AWS account"}
          </button>
        )}
      </div>

      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && canWrite && (
        <ConnectAwsForm
          key={formKey}
          authHeaders={authHeaders}
          onSuccess={handleConnected}
          variant="panel"
          submitLabel="Add AWS account"
        />
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Regions</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Connected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {integrations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No AWS accounts connected yet.{" "}
                  {canWrite && (
                    <button
                      type="button"
                      onClick={openForm}
                      className="text-indigo-600 hover:underline"
                    >
                      Add AWS account
                    </button>
                  )}
                </td>
              </tr>
            )}
            {integrations.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-mono text-slate-900">{item.account_id}</div>
                  <div className="mt-0.5 max-w-md truncate font-mono text-xs text-slate-400">
                    {item.role_arn}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">{item.provider}</td>
                <td className="px-4 py-3 text-slate-600">
                  {item.regions.length > 5
                    ? `${item.regions.length} regions`
                    : item.regions.join(", ")}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {integrations.length > 0 && (
        <p className="text-sm text-slate-500">
          Ready for an assessment?{" "}
          <Link to="/scans" className="font-medium text-indigo-600 hover:underline">
            Go to Assessments → {copy.runAssessment}
          </Link>
        </p>
      )}
    </div>
  );
}
