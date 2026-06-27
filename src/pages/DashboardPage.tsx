import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getScanCompliance, listFindings, listScans } from "../lib/api";
import { formatDate } from "../lib/format";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Scan, ScanCompliance } from "../types/platform";

export function DashboardPage() {
  const { authHeaders } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [compliance, setCompliance] = useState<ScanCompliance | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await listScans(authHeaders, 10);
        if (cancelled) return;
        setScans(rows);
        const latest = rows.find((s) => s.status === "completed" || s.status === "completed_with_errors");
        if (latest) {
          const [comp, findings] = await Promise.all([
            getScanCompliance(authHeaders, latest.id),
            listFindings(authHeaders, latest.id, { result: "fail" }),
          ]);
          if (!cancelled) {
            setCompliance(comp);
            setFailCount(findings.length);
          }
        }
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authHeaders]);

  const latest = scans[0];

  if (loading) {
    return <p className="text-slate-500">Loading dashboard…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Could not reach API</p>
        <p className="mt-1 text-sm">{error}</p>
        <p className="mt-2 text-sm">
          Start backend: <code className="rounded bg-red-100 px-1">compliance-engine/scripts/start_platform_v2.ps1</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Cloud security overview</h1>
        <p className="mt-1 text-sm text-slate-500">CIS AWS v6 compliance from asset inventory</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">CIS score</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {compliance ? `${compliance.score.toFixed(1)}%` : "—"}
          </p>
          {compliance && (
            <p className="mt-1 text-xs text-slate-500">{compliance.framework_title}</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Open failures</p>
          <p className="mt-2 text-3xl font-semibold text-red-600">{failCount}</p>
          <p className="mt-1 text-xs text-slate-500">From latest completed scan</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Recent scans</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{scans.length}</p>
          <Link to="/scans" className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
      </div>

      {latest && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-medium text-slate-900">Latest scan</h2>
            <Link to={`/scans/${latest.id}`} className="text-sm text-indigo-600 hover:underline">
              Details
            </Link>
          </div>
          <div className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-slate-400">Status</span>
              <div className="mt-1">
                <StatusBadge status={latest.status} />
              </div>
            </div>
            <div>
              <span className="text-slate-400">Completed</span>
              <p className="mt-1 text-slate-700">{formatDate(latest.completed_at)}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
