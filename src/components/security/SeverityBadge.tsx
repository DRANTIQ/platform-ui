import { severityTone } from "../../lib/format";

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${severityTone(severity)}`}>
      {severity}
    </span>
  );
}

export function SeverityPills({ counts }: { counts: Record<string, number> }) {
  const items = [
    { key: "critical", label: "Critical", tone: "text-red-700 bg-red-50 border-red-200" },
    { key: "high", label: "High", tone: "text-orange-800 bg-orange-50 border-orange-200" },
    { key: "medium", label: "Medium", tone: "text-amber-800 bg-amber-50 border-amber-200" },
    { key: "low", label: "Low", tone: "text-slate-600 bg-slate-50 border-slate-200" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, tone }) =>
        counts[key] ? (
          <span key={key} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${tone}`}>
            {counts[key]} {label}
          </span>
        ) : null,
      )}
    </div>
  );
}

import type { SecurityScoreBand } from "../../lib/riskScore";
import { scoreDisplay, securityScoreBand, securityScoreLabel } from "../../lib/riskScore";

export function ScoreRing({ score, size = "lg" }: { score: number | null; size?: "lg" | "md" }) {
  if (score == null) {
    const dim = size === "lg" ? "h-28 w-28 text-lg" : "h-20 w-20 text-base";
    return (
      <div className={`flex ${dim} flex-col items-center justify-center rounded-full border-4 border-slate-200 bg-slate-50`}>
        <span className="font-bold text-slate-400">—</span>
      </div>
    );
  }
  const band: SecurityScoreBand = securityScoreBand(score);
  const tone =
    band === "excellent" ? "text-emerald-600" : band === "good" ? "text-amber-600" : "text-red-600";
  const ring =
    band === "excellent"
      ? "border-emerald-200 bg-emerald-50"
      : band === "good"
        ? "border-amber-200 bg-amber-50"
        : "border-red-200 bg-red-50";
  const dim = size === "lg" ? "h-28 w-28" : "h-20 w-20";
  const { value } = scoreDisplay(score);
  const label = securityScoreLabel(score);
  return (
    <div className={`flex ${dim} flex-col items-center justify-center rounded-full border-4 ${ring}`}>
      <span className={`font-bold ${tone} ${size === "lg" ? "text-3xl" : "text-xl"}`}>{value}</span>
      <span className={`text-xs font-semibold ${tone}`}>{label}</span>
    </div>
  );
}
