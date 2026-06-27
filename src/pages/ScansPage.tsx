import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createScan, listIntegrations, listScans } from "../lib/api";
import { formatDate } from "../lib/format";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Integration, Scan } from "../types/platform";

export function ScansPage() {
  const { authHeaders, canWrite } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
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
  }, [authHeaders]);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load scans"))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleRunScan() {
    if (!integrations.length) {
      setError("No AWS integration registered for this tenant");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const scan = await createScan(authHeaders, integrations[0].id);
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
          <h1 className="text-2xl font-semibold text-slate-900">Scans</h1>
          <p className="text-sm text-slate-500">Collection → inventory → policy evaluation</p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={handleRunScan}
            disabled={running}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {running ? "Starting…" : "Run scan"}
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
              <th className="px-4 py-3 font-medium">Scan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Started</th>
              <th className="px-4 py-3 font-medium">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scans.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No scans yet
                </td>
              </tr>
            )}
            {scans.map((scan) => (
              <tr key={scan.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/scans/${scan.id}`} className="font-mono text-indigo-600 hover:underline">
                    {scan.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={scan.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(scan.started_at)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(scan.completed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
