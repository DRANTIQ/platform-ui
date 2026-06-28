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

export function ScoreRing({ score, size = "lg" }: { score: number; size?: "lg" | "md" }) {
  const tone =
    score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const ring =
    score >= 80 ? "border-emerald-200 bg-emerald-50" : score >= 50 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50";
  const dim = size === "lg" ? "h-28 w-28 text-3xl" : "h-20 w-20 text-xl";
  return (
    <div className={`flex ${dim} flex-col items-center justify-center rounded-full border-4 ${ring}`}>
      <span className={`font-bold ${tone}`}>{score.toFixed(0)}%</span>
    </div>
  );
}
