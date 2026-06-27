import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createAwsIntegration, listIntegrations } from "../lib/api";
import { formatDate } from "../lib/format";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Integration } from "../types/platform";

const DEFAULT_REGIONS = "us-east-1,us-west-2";

export function IntegrationsPage() {
  const { authHeaders, canWrite } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [externalId, setExternalId] = useState("");
  const [regions, setRegions] = useState(DEFAULT_REGIONS);

  const refresh = useCallback(async () => {
    const rows = await listIntegrations(authHeaders);
    setIntegrations(rows);
  }, [authHeaders]);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load integrations"))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const regionList = regions
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    try {
      await createAwsIntegration(authHeaders, {
        account_id: accountId.trim(),
        role_arn: roleArn.trim(),
        external_id: externalId.trim(),
        regions: regionList,
      });
      setShowForm(false);
      setAccountId("");
      setRoleArn("");
      setExternalId("");
      setRegions(DEFAULT_REGIONS);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register integration");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading integrations…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Integrations</h1>
          <p className="text-sm text-slate-500">Connect AWS accounts for security scanning</p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {showForm ? "Cancel" : "Connect AWS"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {showForm && canWrite && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-medium text-slate-900">Connect AWS account</h2>
          <p className="text-sm text-slate-500">
            Create a cross-account IAM role in your AWS account that trusts the platform. Use the
            same external ID here and in the role trust policy.
          </p>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">AWS account ID</span>
            <input
              required
              pattern="[0-9]{12}"
              title="12-digit AWS account ID"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="123456789012"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Role ARN</span>
            <input
              required
              minLength={20}
              value={roleArn}
              onChange={(e) => setRoleArn(e.target.value)}
              placeholder="arn:aws:iam::123456789012:role/PlatformReadOnly"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">External ID</span>
            <input
              required
              minLength={8}
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="unique-external-id"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Regions</span>
            <input
              required
              value={regions}
              onChange={(e) => setRegions(e.target.value)}
              placeholder="us-east-1,us-west-2"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-xs text-slate-400">Comma-separated region codes</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "Connecting…" : "Register integration"}
          </button>
        </form>
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
                  No integrations yet.{" "}
                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="text-indigo-600 hover:underline"
                    >
                      Connect AWS
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
                <td className="px-4 py-3 text-slate-600">{item.regions.join(", ")}</td>
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
          Ready to scan?{" "}
          <Link to="/scans" className="font-medium text-indigo-600 hover:underline">
            Go to Scans → Run scan
          </Link>
        </p>
      )}
    </div>
  );
}
