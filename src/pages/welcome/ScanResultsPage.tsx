import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PriorityFixList } from "../../components/security/PriorityFixList";
import { useAuth } from "../../contexts/AuthContext";
import { getScanFixPriorities, getScanRiskSummary, listScans, updateOnboardingState } from "../../lib/api";
import type { FixPriorityItem, ScanRiskSummary } from "../../types/platform";

export function ScanResultsPage() {
  const { authHeaders, refreshMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stateScanId = (location.state as { scanId?: string } | null)?.scanId;

  const [scanId, setScanId] = useState<string | null>(stateScanId ?? null);
  const [summary, setSummary] = useState<ScanRiskSummary | null>(null);
  const [priorities, setPriorities] = useState<FixPriorityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let id = stateScanId ?? null;
        if (!id) {
          const scans = await listScans(authHeaders, 5);
          id = scans.find((s) => s.status === "completed" || s.status === "completed_with_errors")?.id ?? null;
        }
        if (!id || cancelled) {
          setLoading(false);
          return;
        }
        setScanId(id);
        const [risk, fixes] = await Promise.all([
          getScanRiskSummary(authHeaders, id),
          getScanFixPriorities(authHeaders, id, 3),
        ]);
        if (!cancelled) {
          setSummary(risk);
          setPriorities(fixes);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, stateScanId]);

  async function finish() {
    await updateOnboardingState(authHeaders, "ONBOARDING_COMPLETE");
    await refreshMe();
    navigate("/", { replace: true });
  }

  if (loading) {
    return <p className="text-center text-slate-500">Loading results…</p>;
  }

  const count = summary?.total_findings ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-indigo-600">Step 4 of 4 · Review results</p>
      <p className="mt-4 text-4xl">🎉</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Congratulations!</h1>
      <p className="mt-2 text-slate-600">
        {count > 0
          ? `We found ${count} security issue${count !== 1 ? "s" : ""} in your AWS account.`
          : "Your first scan completed with no failing security checks."}
      </p>

      {priorities.length > 0 && scanId && (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Top priorities</h2>
          <PriorityFixList items={priorities} scanId={scanId} limit={3} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {scanId && (
          <Link
            to={`/scans/${scanId}`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View full report
          </Link>
        )}
        <button
          type="button"
          onClick={finish}
          className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
