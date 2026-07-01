import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useScanPolling } from "../hooks/useScanPolling";
import { PriorityFixList, TopRiskListItem } from "../components/security/PriorityFixList";
import { ScoreRing, SeverityBadge, SeverityPills } from "../components/security/SeverityBadge";
import { DEFAULT_FRAMEWORK_ID } from "../lib/config";
import {
  getScanCompliance,
  getScanTimeline,
  listAssets,
  listComplianceFrameworks,
  listFindings,
} from "../lib/api";
import { loadScanExperience } from "../lib/scanExperience";
import {
  controlStatusTone,
  formatDate,
  formatRelativeTime,
  isTerminalStatus,
} from "../lib/format";
import {
  assetHealthFromPriorities,
  customerTimeline,
  groupAssetsByType,
  resourceDisplayName,
  resourceLabel,
  riskHeadline,
  riskSummary as findingRiskSummary,
  scanDurationLabel,
} from "../lib/securityPresentation";
import { copy, customerFrameworkTitle } from "../lib/productCopy";
import { accountScopeLabel, formatScanError } from "../lib/integrationDisplay";
import { scoreDisplay } from "../lib/riskScore";
import { StatusBadge } from "../components/ui/StatusBadge";
import type {
  Asset,
  ComplianceFramework,
  ControlResult,
  Finding,
  FixPriorityItem,
  ScanCompliance,
  ScanRiskSummary,
  TimelineEvent,
  TopRiskItem,
} from "../types/platform";

type Tab = "overview" | "issues" | "resources" | "compliance" | "timeline";

export function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const { authHeaders } = useAuth();
  const { scan, error: pollError, loading: pollLoading } = useScanPolling(authHeaders, scanId);
  const [tab, setTab] = useState<Tab>("overview");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsLoaded, setFindingsLoaded] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [compliance, setCompliance] = useState<ScanCompliance | null>(null);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState(DEFAULT_FRAMEWORK_ID);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [scanRiskSummary, setScanRiskSummary] = useState<ScanRiskSummary | null>(null);
  const [fixPriorities, setFixPriorities] = useState<FixPriorityItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  const terminal = scan ? isTerminalStatus(scan.status) : false;
  const fails = findings.filter((f) => f.result === "fail");
  const failCount = scanRiskSummary?.total_findings ?? fails.length;
  const severity: Record<string, number> = scanRiskSummary
    ? {
        critical: scanRiskSummary.critical,
        high: scanRiskSummary.high,
        medium: scanRiskSummary.medium,
        low: scanRiskSummary.low,
        info: scanRiskSummary.info,
      }
    : { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const topRisks: TopRiskItem[] = scanRiskSummary?.top_risks ?? [];

  useEffect(() => {
    if (!scanId || !terminal) return;
    let cancelled = false;
    async function loadDetails() {
      try {
        const [a, experience, tl, fw] = await Promise.all([
          listAssets(authHeaders, scanId!),
          loadScanExperience(authHeaders, scanId!),
          getScanTimeline(authHeaders, scanId!),
          listComplianceFrameworks(authHeaders).catch(() => [] as ComplianceFramework[]),
        ]);
        if (cancelled) return;
        setAssets(a);
        setScanRiskSummary(experience.summary);
        setFixPriorities(experience.priorities);
        setTimeline(tl);
        if (fw.length > 0) {
          setFrameworks(fw);
          const defaultFw =
            fw.find((f) => f.framework_id === DEFAULT_FRAMEWORK_ID) ?? fw[0];
          setSelectedFrameworkId(defaultFw.framework_id);
        }
        setLoadError(null);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load scan data");
      }
    }
    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, scanId, terminal]);

  useEffect(() => {
    if (!scanId || !terminal) return;
    let cancelled = false;
    setComplianceLoading(true);
    getScanCompliance(authHeaders, scanId, selectedFrameworkId)
      .then((comp) => {
        if (!cancelled) {
          setCompliance(comp);
          setComplianceLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setCompliance(null);
          setComplianceLoading(false);
          if (tab === "compliance") {
            setLoadError(e instanceof Error ? e.message : "Failed to load framework coverage");
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authHeaders, scanId, terminal, selectedFrameworkId, tab]);

  useEffect(() => {
    if (!scanId || !terminal || tab !== "issues" || findingsLoaded) return;
    let cancelled = false;
    listFindings(authHeaders, scanId, { result: "fail" })
      .then((rows) => {
        if (!cancelled) {
          setFindings(rows);
          setFindingsLoaded(true);
        }
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load issues");
      });
    return () => {
      cancelled = true;
    };
  }, [authHeaders, scanId, terminal, tab, findingsLoaded]);

  if (pollLoading && !scan) {
    return <p className="text-slate-500">Loading scan…</p>;
  }

  if (pollError || !scan) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {pollError || "Scan not found"}
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "issues", label: copy.securityFindings },
    { id: "resources", label: `Resources (${assets.length})` },
    { id: "compliance", label: copy.frameworkCoverage },
    { id: "timeline", label: "Timeline" },
  ];

  const duration = scanDurationLabel(scan.started_at, scan.completed_at);
  const customerTl = customerTimeline(timeline);
  const resourceGroups = groupAssetsByType(assets);
  const accountLabel = accountScopeLabel(scan.provider);
  const scanFailed = scan.status === "failed";
  const failureMessage = formatScanError(scan.error);

  return (
    <div className="space-y-6">
      <header>
        <Link to="/scans" className="text-sm text-indigo-600 hover:underline">
          ← Scans
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{copy.scanReport}</h1>
          <StatusBadge status={scan.status} />
          {!terminal && <span className="text-xs text-blue-600 animate-pulse">Updating…</span>}
        </div>
        {scan.account_id && (
          <p className="mt-1 text-sm text-slate-500">
            {accountLabel} <span className="font-mono">{scan.account_id}</span>
            {scan.completed_at && (
              <span className="ml-3">· {formatRelativeTime(scan.completed_at)}</span>
            )}
          </p>
        )}
      </header>

      {scanFailed && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          <p className="font-semibold">This assessment did not complete</p>
          <p className="mt-1">
            {failureMessage ??
              "No cloud resources were collected. Open the Timeline tab for the failure reason, then run a new scan."}
          </p>
          <p className="mt-2 text-red-800">
            For Azure: confirm the service principal has <strong>Reader</strong> on the subscription,
            the client secret is valid, and your selected regions contain resources.
          </p>
        </div>
      )}

      {loadError && terminal && !scanFailed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ScoreRing score={scanRiskSummary?.score ?? compliance?.score ?? null} />
            <div>
              <p className="text-sm text-slate-500">{copy.overallSecurityScore}</p>
              {scanRiskSummary?.cloud_resources != null && (
                <p className="mt-1 text-sm text-slate-600">
                  {scanRiskSummary.cloud_resources} {copy.cloudResources.toLowerCase()} ·{" "}
                  {scanRiskSummary.resources_protected ?? 0} {copy.resourcesProtected.toLowerCase()} ·{" "}
                  {scanRiskSummary.resources_at_risk ?? 0} {copy.resourcesAtRisk.toLowerCase()}
                </p>
              )}
              <p className="mt-1 text-lg font-medium text-slate-900">
                {scanFailed
                  ? "Assessment incomplete"
                  : failCount === 0
                    ? "No open risks"
                    : `${failCount} open risk${failCount !== 1 ? "s" : ""}`}
              </p>
              <div className="mt-3">
                <SeverityPills counts={severity} />
              </div>
            </div>
          </div>

          {topRisks.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold text-slate-900">{copy.topPriorities}</h2>
              {topRisks.slice(0, 3).map((risk, i) => (
                <TopRiskListItem key={risk.finding_id} risk={risk} scanId={scanId!} index={i + 1} />
              ))}
            </section>
          )}

          <section className="space-y-2">
            <h2 className="font-semibold text-slate-900">What should I fix first?</h2>
            <PriorityFixList
              items={fixPriorities}
              scanId={scanId!}
              limit={3}
              emptyMessage={
                scanFailed
                  ? "Fix the connection or permissions issue above, then run a new assessment."
                  : "No open security issues — your latest scan looks good."
              }
              emptyTone={scanFailed ? "neutral" : "success"}
            />
          </section>
        </div>
      )}

      {tab === "issues" && (
        <div className="space-y-4">
          {!findingsLoaded && <p className="text-slate-500">Loading issues…</p>}
          {findingsLoaded && fails.length === 0 && (
            <p className="text-slate-500">No security issues in this scan.</p>
          )}
          {findingsLoaded &&
            fails.map((f) => (
              <Link
                key={f.id}
                to={`/scans/${scanId}/findings/${f.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{riskHeadline(f)}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Affected resource:{" "}
                      <span className="font-medium">{resourceDisplayName(f)}</span>
                    </p>
                  </div>
                  <SeverityBadge severity={f.severity} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-1">
                  <InfoBlock label="Risk" value={findingRiskSummary(f)} />
                </div>
                <p className="mt-3 text-sm font-medium text-indigo-600">View details →</p>
              </Link>
            ))}
        </div>
      )}

      {tab === "resources" && (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">{accountLabel}</h2>
            <p className="mt-1 font-mono text-lg">{scan.account_id ?? "—"}</p>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Summary</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {resourceGroups.map((g) => (
                  <li key={g.type}>
                    {g.count} {g.label}
                    {g.count !== 1 ? "s" : ""}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="space-y-3">
            {assets.map((a) => {
              const health = assetHealthFromPriorities(a.resource_id, fixPriorities);
              const resourceIssues = fixPriorities.filter((p) => p.resource_id === a.resource_id);
              const name =
                (a.properties?.name as string) ??
                (a.properties?.bucket_name as string) ??
                a.resource_id.split("/").pop();
              const isExpanded = expandedResource === a.resource_id;
              return (
                <div
                  key={a.resource_id}
                  className="rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedResource(isExpanded ? null : a.resource_id)
                    }
                    className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{name}</p>
                      <p className="text-sm text-slate-500">
                        {resourceLabel(a.resource_type)}
                        {a.region ? ` · ${a.region}` : ""}
                        {resourceIssues.length > 0 && (
                          <span className="ml-2 text-red-600">
                            · {resourceIssues.length} issue
                            {resourceIssues.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    <HealthBadge health={health} />
                  </button>
                  {isExpanded && resourceIssues.length > 0 && (
                    <ul className="border-t border-slate-100 px-4 py-3 text-sm">
                      {resourceIssues.map((issue) => (
                        <li key={issue.finding_id} className="py-1">
                          <Link
                            to={`/scans/${scanId}/findings/${issue.finding_id}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {issue.display_title}
                          </Link>
                          <span className="ml-2 text-slate-400 capitalize">{issue.severity}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {assets.length === 0 && (
              <p className="text-slate-400">No resources collected yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === "compliance" && (
        <div className="space-y-6">
          {frameworks.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {frameworks.map((fw) => (
                <button
                  key={fw.framework_id}
                  type="button"
                  onClick={() => setSelectedFrameworkId(fw.framework_id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    selectedFrameworkId === fw.framework_id
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {customerFrameworkTitle(fw.display_title ?? fw.title)}
                </button>
              ))}
            </div>
          )}

          {complianceLoading && !compliance && (
            <p className="text-slate-500">Loading framework coverage…</p>
          )}

          {!complianceLoading && !compliance && (
            <p className="text-slate-500">
              {scanFailed
                ? "Framework coverage is unavailable because the assessment did not complete."
                : "Framework coverage is not available for this scan yet. Run a new scan after connecting your account."}
            </p>
          )}

          {compliance && (
            <>
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <ScoreRing score={compliance.score} size="md" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {customerFrameworkTitle(compliance.display_title ?? compliance.framework_title)}
              </h2>
              <p className="text-sm text-slate-500">{copy.securityScore}</p>
              <p className="text-3xl font-bold text-slate-900">
                {scoreDisplay(compliance.score).value}
              </p>
              <p className="text-sm font-semibold text-slate-600">
                {scoreDisplay(compliance.score).label}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryTile
              label={copy.coverageAutomated}
              value={compliance.summary.pass ?? 0}
              tone="text-emerald-700"
            />
            <SummaryTile
              label={copy.coverageAtRisk}
              value={compliance.summary.fail ?? 0}
              tone="text-red-700"
            />
            <SummaryTile label={copy.coverageManual} value={compliance.summary.manual ?? 0} tone="text-slate-600" />
            <SummaryTile
              label={copy.coverageNotAssessed}
              value={compliance.summary.not_assessed ?? 0}
              tone="text-slate-500"
            />
          </div>

          {topRisks.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold text-slate-900">Top failures</h3>
              {topRisks.slice(0, 6).map((risk) => (
                <Link
                  key={risk.finding_id}
                  to={`/scans/${scanId}/findings/${risk.finding_id}`}
                  className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-4 py-2 hover:bg-red-50"
                >
                  <span className="font-medium text-slate-900">{risk.title}</span>
                  <SeverityBadge severity={risk.severity} />
                </Link>
              ))}
            </section>
          )}

          <details className="rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-600">
              {copy.viewRequirementDetails}
            </summary>
            <div className="border-t border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">{copy.requirementColumn}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compliance.controls.map((c: ControlResult) => (
                    <tr key={c.control_id}>
                      <td className="px-4 py-2 font-mono text-xs">{c.control_id}</td>
                      <td className={`px-4 py-2 font-medium capitalize ${controlStatusTone(c.status)}`}>
                        {c.status}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {c.display_title ?? c.title}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
            </>
          )}
        </div>
      )}

      {tab === "timeline" && (
        <div className="space-y-4">
          {duration && (
            <p className="text-sm text-slate-600">
              Duration: <strong>{duration}</strong>
            </p>
          )}
          <ol className="relative space-y-0 border-l-2 border-slate-200 pl-6">
            {customerTl.length === 0 && <li className="text-slate-400">No events yet</li>}
            {customerTl.map((ev, i) => (
              <li key={i} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[1.55rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-indigo-500" />
                <p className="font-medium text-slate-900">{ev.label}</p>
                {ev.at && <p className="text-xs text-slate-400">{formatDate(ev.at)}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function HealthBadge({ health }: { health: "healthy" | "attention" | "critical" }) {
  const map = {
    healthy: "bg-emerald-100 text-emerald-800",
    attention: "bg-amber-100 text-amber-900",
    critical: "bg-red-100 text-red-800",
  };
  const label = { healthy: "Healthy", attention: "Needs attention", critical: "Critical" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[health]}`}>
      {label[health]}
    </span>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
