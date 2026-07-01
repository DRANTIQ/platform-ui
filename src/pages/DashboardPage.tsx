import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { PriorityFixList, TopRiskListItem } from "../components/security/PriorityFixList";
import { ScoreRing } from "../components/security/SeverityBadge";
import {
  listAssets,
  listIntegrations,
  listScans,
} from "../lib/api";
import { formatRelativeTime } from "../lib/format";
import { providerBadgeLabel } from "../lib/integrationDisplay";
import { loadScanExperience } from "../lib/scanExperience";
import { copy } from "../lib/productCopy";
import { environmentHealthLabel, scoreDisplay } from "../lib/riskScore";
import type { FixPriorityItem, Scan, ScanRiskSummary, TopRiskItem } from "../types/platform";

export function DashboardPage() {
  const { authHeaders } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [riskSummary, setRiskSummary] = useState<ScanRiskSummary | null>(null);
  const [priorities, setPriorities] = useState<FixPriorityItem[]>([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [latestScanId, setLatestScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);

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
        if (integrations[0]) {
          setAccountId(integrations[0].account_id);
          setProvider(integrations[0].provider);
        }

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
  const riskCount = riskSummary?.total_findings ?? 0;
  const immediateAction = priorities.length > 0 ? Math.min(priorities.length, 3) : riskSummary?.critical ?? 0;
  const topRisks: TopRiskItem[] = riskSummary?.top_risks ?? [];
  const score = riskSummary?.score ?? null;
  const health = environmentHealthLabel(score);
  const scoreText = score != null ? scoreDisplay(score) : null;
  const cloudResources = riskSummary?.cloud_resources ?? resourceCount;
  const resourcesAtRisk = riskSummary?.resources_at_risk ?? 0;
  const resourcesProtected =
    riskSummary?.resources_protected ?? Math.max(0, cloudResources - resourcesAtRisk);
  const resourceSubtitle =
    cloudResources > 0
      ? `${resourcesProtected} ${copy.resourcesProtected.toLowerCase()} · ${resourcesAtRisk} ${copy.resourcesAtRisk.toLowerCase()}`
      : undefined;

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
        <h1 className="text-2xl font-semibold text-slate-900">Cloud security overview</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {!hasIntegration ? (
            <>
              <p className="text-slate-600">
                Connect AWS or Azure to begin your first security assessment.
              </p>
              <Link
                to="/integrations"
                className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Connect cloud account
              </Link>
            </>
          ) : (
            <>
              <p className="text-slate-600">
                Run your first assessment to map cloud resources and surface risks.
              </p>
              <Link
                to="/scans"
                className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                {copy.runFirstAssessment}
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const heroBorder =
    health === "Healthy"
      ? "border-emerald-200 from-emerald-50"
      : health === "Needs review"
        ? "border-amber-200 from-amber-50"
        : "border-red-200 from-red-50";

  return (
    <div className="space-y-8">
      <section className={`rounded-2xl border bg-gradient-to-br to-white p-6 shadow-sm ${heroBorder}`}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              {copy.yourEnvironment}
              {provider && (
                <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold normal-case text-slate-700">
                  {providerBadgeLabel(provider)}
                </span>
              )}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{health}</h1>
            <p className="mt-2 text-slate-600">
              {riskCount === 0
                ? "No open risks on your latest assessment."
                : `${riskCount} open risk${riskCount !== 1 ? "s" : ""} across your cloud inventory.`}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={score} />
            <p className="text-xs font-medium text-slate-500">{copy.overallSecurityScore}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label={copy.cloudResources}
          value={String(cloudResources)}
          subtitle={resourceSubtitle}
        />
        <StatCard label={copy.openRisks} value={String(riskCount)} alert={riskCount > 0} />
        <StatCard
          label={copy.immediateAction}
          value={String(immediateAction)}
          alert={immediateAction > 0}
        />
        <StatCard
          label={copy.securityScore}
          value={scoreText ? scoreText.value : "—"}
          subtitle={scoreText?.label}
        />
      </div>

      {topRisks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{copy.topPriorities}</h2>
          <div className="space-y-2">
            {topRisks.slice(0, 5).map((risk, i) => (
              <TopRiskListItem key={risk.finding_id} risk={risk} scanId={latestScanId} index={i + 1} />
            ))}
          </div>
        </section>
      )}

      {priorities.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">{copy.immediateAction}</h2>
          <PriorityFixList items={priorities} scanId={latestScanId} limit={3} />
        </section>
      )}

      {latest && (
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <span className="text-slate-400">Recent assessment </span>
              <span className="font-medium text-slate-700">
                {formatRelativeTime(latest.completed_at ?? latest.created_at)}
              </span>
              {accountId && (
                <span className="ml-3 font-mono text-slate-500">
                  {provider === "azure" ? "Subscription" : "Account"} {accountId}
                </span>
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
  subtitle,
  alert,
}: {
  label: string;
  value: string;
  subtitle?: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${alert ? "border-red-200" : "border-slate-200"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${alert ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      {subtitle && <p className="mt-0.5 text-sm font-medium text-slate-500">{subtitle}</p>}
    </div>
  );
}
