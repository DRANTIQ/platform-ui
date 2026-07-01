import { riskScoreShortLabel, riskScoreTone } from "../../lib/riskScore";

/** Compact risk score for list rows (number + short label). */
export function RiskScoreBadge({ score }: { score: number }) {
  return (
    <div
      className={`flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1 ${riskScoreTone(score)}`}
      title={`Risk score ${score}`}
    >
      <span className="text-sm font-bold leading-none">{score}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">
        {riskScoreShortLabel(score)}
      </span>
    </div>
  );
}
