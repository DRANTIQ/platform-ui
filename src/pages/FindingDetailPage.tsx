import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getFinding } from "../lib/api";
import { formatDate, severityTone } from "../lib/format";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Finding } from "../types/platform";

export function FindingDetailPage() {
  const { scanId, findingId } = useParams<{ scanId: string; findingId: string }>();
  const { authHeaders } = useAuth();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scanId || !findingId) return;
    let cancelled = false;
    getFinding(authHeaders, scanId, findingId)
      .then((row) => {
        if (!cancelled) setFinding(row);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load finding");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authHeaders, scanId, findingId]);

  if (loading) return <p className="text-slate-500">Loading finding…</p>;

  if (error || !finding) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error || "Finding not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/scans/${scanId}`} className="text-sm text-indigo-600 hover:underline">
          ← Back to scan
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{finding.title}</h1>
          <StatusBadge status={finding.result} />
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityTone(finding.severity)}`}>
            {finding.severity}
          </span>
        </div>
        <p className="mt-1 font-mono text-sm text-slate-500">{finding.policy_id}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailCard label="Resource type" value={finding.resource_type} />
        <DetailCard label="Result" value={finding.result} />
        <DetailCard label="Status" value={finding.status} />
        <DetailCard label="Evaluated" value={formatDate(finding.evaluated_at)} />
        <div className="sm:col-span-2">
          <DetailCard label="Resource ID" value={finding.resource_id} mono />
        </div>
      </div>

      {finding.description && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Description</h2>
          <p className="mt-2 text-sm text-slate-700">{finding.description}</p>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Evidence</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">
          {JSON.stringify(finding.evidence, null, 2)}
        </pre>
      </section>
    </div>
  );
}

function DetailCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm text-slate-900 ${mono ? "break-all font-mono" : ""}`}>{value}</p>
    </div>
  );
}
