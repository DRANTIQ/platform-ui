import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PriorityFixList, TopRiskListItem } from "../components/security/PriorityFixList";
import { ScoreRing, SeverityPills } from "../components/security/SeverityBadge";
import {
  listAssets,
  listIntegrations,
  listScans,
} from "../lib/api";
import { formatRelativeTime } from "../lib/format";
import { loadScanExperience } from "../lib/scanExperience";
import { accountRiskSummary } from "../lib/securityPresentation";
import type { FixPriorityItem, Scan, ScanRiskSummary, TopRiskItem } from "../types/platform";

export function DashboardPage() {
  const { authHeaders } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [riskSummary, setRiskSummary] = useState<ScanRiskSummary | null>(null);
  const [priorities, setPriorities] = useState<FixPriorityItem[]>([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [fixMinutes, setFixMinutes] = useState(0);
  const [latestScanId, setLatestScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasIntegration, setHasIntegration] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [rows, integrations] = await Promise.all([
          listScans(authHeaders, 10),
          listIntegrations(authHeaders),
        ]);
        if (cancelled) return;
        setScans(rows);
        setHasIntegration(integrations.length > 0);
        if (integrations[0]) setAccountId(integrations[0].account_id);

        const latest = rows.find(
          (s) => s.status === "completed" || s.status === "completed_with_errors",
        );
        if (!latest) {
          setLoading(false);
          return;
        }
        setLatestScanId(latest.id);

        const [{ summary, priorities: fixList }, assets] = await Promise.all([
          loadScanExperience(authHeaders, latest.id),
          listAssets(authHeaders, latest.id),
        ]);
        if (cancelled) return;

        setRiskSummary(summary);
        setPriorities(fixList);
        setResourceCount(assets.length);
        setFixMinutes(
          fixList.reduce((sum, item) => sum + (item.estimated_fix_minutes ?? 0), 0),
        );
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
  const failCount = riskSummary?.total_findings ?? 0;
  const severity: Record<string, number> = riskSummary
    ? {
        critical: riskSummary.critical,
        high: riskSummary.high,
        medium: riskSummary.medium,
        low: riskSummary.low,
        info: riskSummary.info,
      }
    : { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const topRisks: TopRiskItem[] = riskSummary?.top_risks ?? [];

  if (loading) {
    return <p className="text-slate-500">Loading security overview…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Could not reach API</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (!latestScanId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Security overview</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {!hasIntegration ? (
            <>
              <p className="text-slate-600">
                Connect your AWS account to begin your first security assessment.
              </p>
              <Link
                to="/integrations"
                className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Connect AWS account
              </Link>
            </>
          ) : (
            <>
              <p className="text-slate-600">
                Run your first scan to identify cloud security risks in your AWS account.
              </p>
              <Link
                to="/scans"
                className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Run first scan
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            {failCount > 0 ? (
              <>
                <p className="text-sm font-medium uppercase tracking-wide text-red-600">
                  Security alert
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  Your AWS account has {failCount} security issue{failCount !== 1 ? "s" : ""}
                </h1>
                <div className="mt-4">
                  <SeverityPills counts={severity} />
                </div>
                {fixMinutes > 0 && (
                  <p className="mt-4 text-sm text-slate-600">
                    Estimated time to fix: <strong>{fixMinutes} minutes</strong>
                  </p>
                )}
                <p className="mt-2 text-sm text-red-800/80">
                  {accountRiskSummary(failCount, severity)}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-emerald-800">No critical issues detected</h1>
                <p className="mt-2 text-slate-600">Your latest scan found no failing security checks.</p>
              </>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={riskSummary?.score ?? null} />
            <p className="text-xs font-medium text-slate-500">Overall security score</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Critical" value={String(severity.critical ?? 0)} alert={severity.critical > 0} />
        <StatCard label="High" value={String(severity.high ?? 0)} />
        <StatCard label="Resources" value={String(resourceCount)} />
        <StatCard label="Compliance failures" value={String(failCount)} />
      </div>

      {topRisks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Top business risks</h2>
          <div className="space-y-2">
            {topRisks.slice(0, 5).map((risk, i) => (
              <TopRiskListItem key={risk.finding_id} risk={risk} scanId={latestScanId} index={i + 1} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">What should I fix first?</h2>
        <PriorityFixList items={priorities} scanId={latestScanId} limit={3} />
      </section>

      {latest && (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <span className="text-slate-400">Recent scan </span>
              <span className="font-medium text-slate-700">
                {formatRelativeTime(latest.completed_at ?? latest.created_at)}
              </span>
              {accountId && (
                <span className="ml-3 font-mono text-slate-500">Account {accountId}</span>
              )}
            </div>
            <Link
              to={`/scans/${latestScanId}`}
              className="font-medium text-indigo-600 hover:underline"
            >
              View full report →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${alert ? "border-red-200" : "border-slate-200"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${alert ? "text-red-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
