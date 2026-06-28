import { Link } from "react-router-dom";
import type { Finding } from "../../types/platform";
import {
  estimatedFixMinutes,
  fixInstruction,
  resourceDisplayName,
  riskHeadline,
} from "../../lib/securityPresentation";
import { SeverityBadge } from "./SeverityBadge";

export function PriorityFixList({
  findings,
  scanId,
  limit = 5,
}: {
  findings: Finding[];
  scanId: string;
  limit?: number;
}) {
  if (findings.length === 0) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-6 text-sm text-emerald-800">
        No open security issues — your latest scan looks good.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      {findings.slice(0, limit).map((f, i) => (
        <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Priority {i + 1}
            </p>
            <Link
              to={`/scans/${scanId}/findings/${f.id}`}
              className="mt-0.5 block font-medium text-slate-900 hover:text-indigo-600"
            >
              {riskHeadline(f)}
            </Link>
            <p className="mt-1 text-sm text-slate-500">{fixInstruction(f)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <SeverityBadge severity={f.severity} />
            <span className="text-sm text-slate-500">{estimatedFixMinutes(f)} min</span>
            <Link
              to={`/scans/${scanId}/findings/${f.id}`}
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
