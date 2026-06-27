import { statusTone } from "../../lib/format";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone(status)}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
