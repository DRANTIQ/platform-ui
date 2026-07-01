import type { RiskWhyBadge } from "../../types/platform";

const BADGE_TONE: Record<string, string> = {
  internet_exposed: "border-red-200 bg-red-50 text-red-800",
  sensitive_data: "border-orange-200 bg-orange-50 text-orange-900",
  public_resource: "border-red-200 bg-red-50 text-red-800",
  insufficient_logging: "border-amber-200 bg-amber-50 text-amber-900",
  no_encryption: "border-amber-200 bg-amber-50 text-amber-900",
  identity_exposure: "border-purple-200 bg-purple-50 text-purple-900",
};

export function RiskSignalBadges({ badges }: { badges: RiskWhyBadge[] }) {
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.id}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            BADGE_TONE[badge.id] ?? "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
