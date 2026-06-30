import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createScan, listIntegrations, listScans } from "../lib/api";
import { formatDate, formatRelativeTime } from "../lib/format";
import { copy } from "../lib/productCopy";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Integration, Scan } from "../types/platform";

const INTEGRATION_STORAGE_KEY = "platform-ui:selected-integration";

function integrationLabel(integration: Integration): string {
  return `AWS ${integration.account_id} (${integration.status})`;
}

export function ScansPage() {
  const { authHeaders, canWrite } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [scanRows, intRows] = await Promise.all([
      listScans(authHeaders),
      listIntegrations(authHeaders),
    ]);
    setScans(scanRows);
    setIntegrations(intRows);
    setSelectedIntegrationId((current) => {
      if (current && intRows.some((row) => row.id === current)) return current;
      const stored = localStorage.getItem(INTEGRATION_STORAGE_KEY);
      if (stored && intRows.some((row) => row.id === stored)) return stored;
      return intRows[0]?.id ?? "";
    });
  }, [authHeaders]);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load scans"))
      .finally(() => setLoading(false));
  }, [refresh]);

  function handleIntegrationChange(integrationId: string) {
    setSelectedIntegrationId(integrationId);
    if (integrationId) {
      localStorage.setItem(INTEGRATION_STORAGE_KEY, integrationId);
    }
  }

  async function handleRunScan() {
    if (!integrations.length) {
      setError("No AWS integration registered for this tenant");
      return;
    }
    if (!selectedIntegrationId) {
      setError("Select an AWS account to scan");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const scan = await createScan(authHeaders, selectedIntegrationId);
      await refresh();
      navigate(`/scans/${scan.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start scan");
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading scans…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Security assessments</h1>
          <p className="text-sm text-slate-500">
            Run {copy.productName.toLowerCase()} on your AWS accounts
          </p>
        </div>
        {canWrite && integrations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-slate-600">
              <span className="sr-only">AWS account</span>
              <select
                value={selectedIntegrationId}
                onChange={(e) => handleIntegrationChange(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {integrations.map((integration) => (
                  <option key={integration.id} value={integration.id}>
                    {integrationLabel(integration)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleRunScan}
              disabled={running || !selectedIntegrationId}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {running ? copy.scanning : copy.runAssessment}
            </button>
          </div>
        )}
        {canWrite && !integrations.length && (
          <button
            type="button"
            disabled
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            {copy.runAssessment}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {!integrations.length && canWrite && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Connect an AWS account before running a scan.{" "}
          <Link to="/integrations" className="font-medium text-indigo-600 hover:underline">
            Go to Integrations
          </Link>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scans.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  {integrations.length === 0 ? (
                    <>
                      Connect your AWS account to begin your first security assessment.{" "}
                      <Link to="/integrations" className="font-medium text-indigo-600 hover:underline">
                        Connect AWS
                      </Link>
                    </>
                  ) : (
                    <>
                      Run your first scan to identify cloud security risks.{" "}
                      <button
                        type="button"
                        onClick={handleRunScan}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {copy.runAssessment}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )}
            {scans.map((scan) => (
              <tr key={scan.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/scans/${scan.id}`} className="font-medium text-indigo-600 hover:underline">
                    {formatRelativeTime(scan.completed_at ?? scan.started_at ?? scan.created_at)}
                  </Link>
                  <p className="text-xs text-slate-400">{formatDate(scan.completed_at ?? scan.started_at)}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={scan.status} />
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">{scan.account_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
