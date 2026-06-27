const TERMINAL = new Set(["completed", "completed_with_errors", "failed"]);

export function isTerminalStatus(status: string): boolean {
  return TERMINAL.has(status);
}

export function statusTone(status: string): string {
  if (status === "completed") return "bg-emerald-100 text-emerald-800";
  if (status === "completed_with_errors") return "bg-amber-100 text-amber-900";
  if (status === "failed") return "bg-red-100 text-red-800";
  if (status === "evaluating" || status === "ingesting" || status === "collecting") {
    return "bg-blue-100 text-blue-800";
  }
  return "bg-slate-100 text-slate-700";
}

export function severityTone(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-900";
    case "medium":
      return "bg-amber-100 text-amber-900";
    case "low":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function controlStatusTone(status: string): string {
  if (status === "pass") return "text-emerald-700";
  if (status === "fail") return "text-red-700";
  return "text-slate-500";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}
