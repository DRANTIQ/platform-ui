import { Link } from "react-router-dom";
import type { Finding, FixPriorityItem, TopRiskItem } from "../../types/platform";
import {
  estimatedFixMinutes,
  fixInstruction,
  resourceDisplayName,
  riskHeadline,
} from "../../lib/securityPresentation";
import { SeverityBadge } from "./SeverityBadge";
import { RiskScoreBadge } from "./RiskScoreBadge";

export function PriorityFixList({
  items,
  scanId,
  limit = 5,
  emptyMessage = "No open security issues — your latest scan looks good.",
  emptyTone = "success",
}: {
  items: FixPriorityItem[];
  scanId: string;
  limit?: number;
  emptyMessage?: string;
  emptyTone?: "success" | "neutral";
}) {
  if (items.length === 0) {
    return (
      <p
        className={`rounded-xl border px-4 py-6 text-sm ${
          emptyTone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-slate-200 bg-slate-50 text-slate-700"
        }`}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      {items.slice(0, limit).map((item) => (
        <div
          key={item.finding_id}
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Priority {item.rank}
            </p>
            <Link
              to={`/scans/${scanId}/findings/${item.finding_id}`}
              className="mt-0.5 block font-medium text-slate-900 hover:text-indigo-600"
            >
              {item.display_title}
            </Link>
            <p className="mt-1 text-sm text-slate-500">
              {item.why_it_matters ?? item.affected_resource}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {item.risk_score != null && item.risk_score > 0 && (
              <RiskScoreBadge score={item.risk_score} />
            )}
            <SeverityBadge severity={item.severity} />
            <span className="text-sm text-slate-500">
              {item.estimated_fix_minutes ?? "—"} min
            </span>
            <Link
              to={`/scans/${scanId}/findings/${item.finding_id}`}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Fix now
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopRiskListItem({
  risk,
  scanId,
  index,
}: {
  risk: TopRiskItem;
  scanId: string;
  index?: number;
}) {
  return (
    <Link
      to={`/scans/${scanId}/findings/${risk.finding_id}`}
      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/30"
    >
      {index != null && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
          {index}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{risk.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">
          {risk.affected_resource}
          {risk.why_it_matters ? ` · ${risk.why_it_matters}` : ""}
        </p>
      </div>
      {risk.risk_score != null && risk.risk_score > 0 && (
        <RiskScoreBadge score={risk.risk_score} />
      )}
      <SeverityBadge severity={risk.severity} />
    </Link>
  );
}

/** @deprecated Use TopRiskListItem with API top_risks instead */
export function IssueListItem({
  finding,
  scanId,
  index,
}: {
  finding: Finding;
  scanId: string;
  index?: number;
}) {
  return (
    <Link
      to={`/scans/${scanId}/findings/${finding.id}`}
      className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/30"
    >
      {index != null && (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
          {index}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{riskHeadline(finding)}</p>
        <p className="mt-0.5 text-sm text-slate-500">{resourceDisplayName(finding)}</p>
      </div>
      <SeverityBadge severity={finding.severity} />
    </Link>
  );
}

/** Legacy helper for finding-based priority rows */
export function LegacyPriorityFixList({
  findings,
  scanId,
  limit = 5,
}: {
  findings: Finding[];
  scanId: string;
  limit?: number;
}) {
  const items: FixPriorityItem[] = findings.map((f, i) => ({
    rank: i + 1,
    finding_id: f.id,
    policy_id: f.policy_id,
    display_title: riskHeadline(f),
    technical_title: f.technical_title ?? f.title,
    severity: f.severity,
    affected_resource: resourceDisplayName(f),
    resource_id: f.resource_id,
    resource_type: f.resource_type,
    why_it_matters: fixInstruction(f),
    business_impact: null,
    estimated_fix_minutes: estimatedFixMinutes(f),
    frameworks: [],
    internet_exposed: false,
    data_sensitive: false,
  }));
  return <PriorityFixList items={items} scanId={scanId} limit={limit} />;
}
