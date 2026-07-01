/** Human-readable security score bands — numbers without % suffix. */

export type SecurityScoreBand = "excellent" | "good" | "needs_attention";

export function securityScoreBand(score: number): SecurityScoreBand {
  if (score >= 85) return "excellent";
  if (score >= 60) return "good";
  return "needs_attention";
}

export function securityScoreLabel(score: number): string {
  const band = securityScoreBand(score);
  if (band === "excellent") return "Excellent";
  if (band === "good") return "Good";
  return "Needs attention";
}

export function environmentHealthLabel(score: number | null): string {
  if (score == null) return "Unknown";
  const band = securityScoreBand(score);
  if (band === "excellent") return "Healthy";
  if (band === "good") return "Needs review";
  return "Needs attention";
}

export function scoreDisplay(score: number): { value: string; label: string } {
  return {
    value: String(Math.round(score)),
    label: securityScoreLabel(score),
  };
}

/** Finding risk score — higher is worse (inverse of security health score). */
export function riskScoreTone(score: number): string {
  if (score >= 85) return "border-red-200 bg-red-50 text-red-800";
  if (score >= 60) return "border-orange-200 bg-orange-50 text-orange-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function riskScoreShortLabel(score: number): string {
  if (score >= 85) return "High";
  if (score >= 60) return "Med";
  return "Low";
}
