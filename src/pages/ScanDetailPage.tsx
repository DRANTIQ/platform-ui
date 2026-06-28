import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useScanPolling } from "../hooks/useScanPolling";
import { PriorityFixList, IssueListItem } from "../components/security/PriorityFixList";
import { ScoreRing, SeverityBadge, SeverityPills } from "../components/security/SeverityBadge";
import {
  getScanCompliance,
  getScanTimeline,
  listAssets,
  listFindings,
} from "../lib/api";
import {
  controlStatusTone,
  formatDate,
  formatRelativeTime,
  isTerminalStatus,
} from "../lib/format";
import {
  assetHealth,
  cisControl,
  customerTimeline,
  groupAssetsByType,
  prioritizedFindings,
  resourceDisplayName,
  resourceLabel,
  riskHeadline,
  riskSummary,
  scanDurationLabel,
  severityCounts,
  uniqueIssuesByPolicy,
} from "../lib/securityPresentation";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Asset, ControlResult, Finding, ScanCompliance, TimelineEvent } from "../types/platform";

type Tab = "overview" | "issues" | "resources" | "compliance" | "timeline";

export function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const { authHeaders } = useAuth();
  const { scan, error: pollError, loading: pollLoading } = useScanPolling(authHeaders, scanId);
  const [tab, setTab] = useState<Tab>("overview");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [compliance, setCompliance] = useState<ScanCompliance | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const terminal = scan ? isTerminalStatus(scan.status) : false;
  const fails = findings.filter((f) => f.result === "fail");
  const severity = severityCounts(fails);

  useEffect(() => {
    if (!scanId || !terminal) return;
    let cancelled = false;
    async function loadDetails() {
      try {
        const [f, a, comp, tl] = await Promise.all([
          listFindings(authHeaders, scanId!),
          listAssets(authHeaders, scanId!),
          getScanCompliance(authHeaders, scanId!),
          getScanTimeline(authHeaders, scanId!),
        ]);
        if (cancelled) return;
        setFindings(f);
        setAssets(a);
        setCompliance(comp);
        setTimeline(tl);
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
    { id: "issues", label: `Issues (${fails.length})` },
    { id: "resources", label: `Resources (${assets.length})` },
    { id: "compliance", label: "CIS compliance" },
    { id: "timeline", label: "Timeline" },
  ];

  const duration = scanDurationLabel(scan.started_at, scan.completed_at);
  const customerTl = customerTimeline(timeline);
  const resourceGroups = groupAssetsByType(assets);
  const topFailures = uniqueIssuesByPolicy(fails);

  return (
    <div className="space-y-6">
      <header>
        <Link to="/scans" className="text-sm text-indigo-600 hover:underline">
          ← Scans
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Security scan report</h1>
          <StatusBadge status={scan.status} />
          {!terminal && <span className="text-xs text-blue-600 animate-pulse">Updating…</span>}
        </div>
        {scan.account_id && (
          <p className="mt-1 text-sm text-slate-500">
            AWS account <span className="font-mono">{scan.account_id}</span>
            {scan.completed_at && (
              <span className="ml-3">· {formatRelativeTime(scan.completed_at)}</span>
            )}
          </p>
        )}
      </header>

      {loadError && terminal && (
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
            {compliance && <ScoreRing score={compliance.score} />}
            <div>
              <p className="text-sm text-slate-500">Overall security score</p>
              <p className="mt-1 text-lg font-medium text-slate-900">
                {fails.length === 0
                  ? "No open issues"
                  : `${fails.length} security issue${fails.length !== 1 ? "s" : ""} found`}
              </p>
              <div className="mt-3">
                <SeverityPills counts={severity} />
              </div>
            </div>
          </div>

          {topFailures.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold text-slate-900">Top issues</h2>
              {topFailures.slice(0, 3).map((f, i) => (
                <IssueListItem key={f.id} finding={f} scanId={scanId!} index={i + 1} />
              ))}
            </section>
          )}

          <section className="space-y-2">
            <h2 className="font-semibold text-slate-900">What should I fix first?</h2>
            <PriorityFixList findings={prioritizedFindings(fails)} scanId={scanId!} limit={3} />
          </section>
        </div>
      )}

      {tab === "issues" && (
        <div className="space-y-4">
          {fails.length === 0 ? (
            <p className="text-slate-500">No security issues in this scan.</p>
          ) : (
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
                      Affected resource: <span className="font-medium">{resourceDisplayName(f)}</span>
                    </p>
                  </div>
                  <SeverityBadge severity={f.severity} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoBlock label="Risk" value={riskSummary(f)} />
                  {cisControl(f) && (
                    <InfoBlock label="Compliance" value={`Fails ${cisControl(f)}`} />
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-indigo-600">View details →</p>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "resources" && (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">AWS account</h2>
            <p className="mt-1 font-mono text-lg">{scan.account_id ?? "—"}</p>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Summary</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {resourceGroups.map((g) => (
                  <li key={g.type}>
                    {g.count} {g.label}{g.count !== 1 ? "s" : ""}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="space-y-3">
            {assets.map((a) => {
              const health = assetHealth(a, findings);
              const name =
                (a.properties?.name as string) ??
                (a.properties?.bucket_name as string) ??
                a.resource_id.split("/").pop();
              return (
                <div
                  key={a.resource_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900">{name}</p>
                    <p className="text-sm text-slate-500">
                      {resourceLabel(a.resource_type)}
                      {a.region ? ` · ${a.region}` : ""}
                    </p>
                  </div>
                  <HealthBadge health={health} />
                </div>
              );
            })}
            {assets.length === 0 && (
              <p className="text-slate-400">No resources collected yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === "compliance" && compliance && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <ScoreRing score={compliance.score} size="md" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{compliance.framework_title}</h2>
              <p className="text-3xl font-bold text-slate-900">{compliance.score.toFixed(0)}%</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryTile label="Passed" value={compliance.summary.pass ?? 0} tone="text-emerald-700" />
            <SummaryTile label="Failed" value={compliance.summary.fail ?? 0} tone="text-red-700" />
            <SummaryTile label="Manual" value={compliance.summary.manual ?? 0} tone="text-slate-600" />
            <SummaryTile
              label="Not collected"
              value={compliance.summary.not_assessed ?? 0}
              tone="text-slate-500"
            />
          </div>

          {topFailures.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold text-slate-900">Top failures</h3>
              {topFailures.slice(0, 6).map((f) => (
                <Link
                  key={f.id}
                  to={`/scans/${scanId}/findings/${f.id}`}
                  className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/50 px-4 py-2 hover:bg-red-50"
                >
                  <span className="font-medium text-slate-900">{riskHeadline(f)}</span>
                  <SeverityBadge severity={f.severity} />
                </Link>
              ))}
            </section>
          )}

          <details className="rounded-xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-600">
              All CIS controls ({compliance.controls.length})
            </summary>
            <div className="border-t border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Control</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compliance.controls.map((c: ControlResult) => (
                    <tr key={c.control_id}>
                      <td className="px-4 py-2 font-mono text-xs">{c.control_id}</td>
                      <td className={`px-4 py-2 font-medium capitalize ${controlStatusTone(c.status)}`}>
                        {c.status}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{c.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
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
