import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEnvironmentScope } from "../contexts/EnvironmentScopeContext";
import { PriorityFixList, TopRiskListItem } from "../components/security/PriorityFixList";
import { ScoreRing } from "../components/security/SeverityBadge";
import { EnvironmentScopeSelect } from "../components/layout/EnvironmentScopeSelect";
import { StatusBadge } from "../components/ui/StatusBadge";
import { listAssets, listScans } from "../lib/api";
import { formatRelativeTime } from "../lib/format";
import {
  latestCompletedScanForIntegration,
  latestScanForIntegration,
  providerBadgeLabel,
  scopeDisplayLabel,
} from "../lib/integrationDisplay";
import { loadScanExperience } from "../lib/scanExperience";
import { copy } from "../lib/productCopy";
import { environmentHealthLabel, scoreDisplay } from "../lib/riskScore";
import type { FixPriorityItem, Scan, ScanRiskSummary, TopRiskItem } from "../types/platform";

export function DashboardPage() {
  const { isSingleAccount } = useEnvironmentScope();

  if (isSingleAccount) {
    return <SingleAccountDashboard />;
  }
  return <MultiAccountDashboard />;
}

function MultiAccountDashboard() {
  const { authHeaders } = useAuth();
  const { scope, setScope, filteredIntegrations, integrations, loading: scopeLoading } =
    useEnvironmentScope();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listScans(authHeaders, 50)
      .then((rows) => {
        if (!cancelled) setScans(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load assessments");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authHeaders]);

  const rows = useMemo(
    () =>
      filteredIntegrations.map((integration) => {
        const latest = latestScanForIntegration(scans, integration.id);
        const latestCompleted = latestCompletedScanForIntegration(scans, integration.id);
        const needsAttention =
          integration.status === "invalid" ||
          latest?.status === "failed" ||
          !latestCompleted;
        return { integration, latest, latestCompleted, needsAttention };
      }),
    [filteredIntegrations, scans],
  );

  const assessedCount = rows.filter((row) => row.latestCompleted).length;
  const attentionCount = rows.filter((row) => row.needsAttention).length;

  if (scopeLoading || loading) {
    return <p className="text-slate-500">Loading security overview…</p>;
  }

  if (integrations.length === 0) {
    return <EmptyWorkspace />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Could not reach API</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cloud security overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            {scopeDisplayLabel(scope, integrations)} · {filteredIntegrations.length} connected account
            {filteredIntegrations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <EnvironmentScopeSelect />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Connected accounts" value={String(filteredIntegrations.length)} />
        <StatCard label="Assessed" value={String(assessedCount)} subtitle="Latest completed scan" />
        <StatCard
          label="Need attention"
          value={String(attentionCount)}
          alert={attentionCount > 0}
          subtitle="Invalid, failed, or never assessed"
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Accounts</h2>
          <p className="text-sm text-slate-500">Select an account to view score, risks, and priorities</p>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Integration</th>
              <th className="px-4 py-3 font-medium">Last assessment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ integration, latest, latestCompleted, needsAttention }) => (
              <tr key={integration.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {providerBadgeLabel(integration.provider)}
                    </span>
                    <span className="font-mono text-slate-900">{integration.account_id}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={integration.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {latest
                    ? formatRelativeTime(latest.completed_at ?? latest.created_at)
                    : "Never"}
                </td>
                <td className="px-4 py-3">
                  {latest ? (
                    <StatusBadge status={latest.status} />
                  ) : (
                    <span className="text-slate-400">No scans</span>
                  )}
                  {needsAttention && integration.status === "invalid" && (
                    <p className="mt-1 text-xs text-amber-700">Fix connection</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setScope(integration.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Open dashboard
                    </button>
                    {latestCompleted && (
                      <Link
                        to={`/scans/${latestCompleted.id}`}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        View report
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-sm text-slate-500">
        <Link to="/scans" className="font-medium text-indigo-600 hover:underline">
          Manage assessments →
        </Link>
      </p>
    </div>
  );
}

function SingleAccountDashboard() {
  const { authHeaders } = useAuth();
  const { scope, integrations, integrationsById } = useEnvironmentScope();
  const integration = integrationsById.get(scope);
  const [scans, setScans] = useState<Scan[]>([]);
  const [riskSummary, setRiskSummary] = useState<ScanRiskSummary | null>(null);
  const [priorities, setPriorities] = useState<FixPriorityItem[]>([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [latestScanId, setLatestScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!integration) return;
    let cancelled = false;

    async function load() {
      try {
        const rows = await listScans(authHeaders, 50);
        if (cancelled) return;
        setScans(rows);

        const latest = latestCompletedScanForIntegration(rows, integration!.id);
        if (!latest) {
          setLatestScanId(null);
          setRiskSummary(null);
          setPriorities([]);
          setResourceCount(0);
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

    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, integration]);

  const latest = integration ? latestScanForIntegration(scans, integration.id) : undefined;
  const provider = integration?.provider ?? null;
  const accountId = integration?.account_id ?? null;

  if (!integration) {
    return <EmptyWorkspace />;
  }

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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Cloud security overview</h1>
            <p className="mt-1 text-sm text-slate-500">
              {providerBadgeLabel(integration.provider)} · {integration.account_id}
            </p>
          </div>
          <EnvironmentScopeSelect />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            No completed assessment for this account yet. Run a scan to see your security score and
            priorities.
          </p>
          <Link
            to="/scans"
            className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            {copy.runFirstAssessment}
          </Link>
        </div>
      </div>
    );
  }

  const riskCount = riskSummary?.total_findings ?? 0;
  const immediateAction =
    priorities.length > 0 ? Math.min(priorities.length, 3) : riskSummary?.critical ?? 0;
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

  const heroBorder =
    health === "Healthy"
      ? "border-emerald-200 from-emerald-50"
      : health === "Needs review"
        ? "border-amber-200 from-amber-50"
        : "border-red-200 from-red-50";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {scopeDisplayLabel(scope, integrations)}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{health}</h1>
        </div>
        <EnvironmentScopeSelect />
      </div>

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
            <p className="mt-2 text-slate-600">
              {riskCount === 0
                ? "No open risks on the latest assessment for this account."
                : `${riskCount} open risk${riskCount !== 1 ? "s" : ""} on the latest assessment.`}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={score} />
            <p className="text-xs font-medium text-slate-500">{copy.overallSecurityScore}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label={copy.cloudResources} value={String(cloudResources)} subtitle={resourceSubtitle} />
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
              <span className="text-slate-400">Latest assessment </span>
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

function EmptyWorkspace() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Cloud security overview</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-slate-600">Connect AWS or Azure to begin your first security assessment.</p>
        <Link
          to="/integrations"
          className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Connect cloud account
        </Link>
      </div>
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
