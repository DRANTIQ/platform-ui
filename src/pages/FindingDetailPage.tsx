import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { SeverityBadge } from "../components/security/SeverityBadge";
import { getFinding, listAssets } from "../lib/api";
import { formatDate } from "../lib/format";
import {
  awsCliFix,
  awsConsoleUrl,
  businessImpact,
  cisControl,
  cloudformationFix,
  estimatedFixMinutes,
  fixInstruction,
  formatEvidenceSummary,
  frameworkTags,
  resourceRegion,
  riskHeadline,
  riskSummary,
  terraformFix,
} from "../lib/securityPresentation";
import type { Asset, FindingDetail } from "../types/platform";

export function FindingDetailPage() {
  const { scanId, findingId } = useParams<{ scanId: string; findingId: string }>();
  const { authHeaders } = useAuth();
  const [finding, setFinding] = useState<FindingDetail | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);

  useEffect(() => {
    if (!scanId || !findingId) return;
    let cancelled = false;
    Promise.all([getFinding(authHeaders, scanId, findingId), listAssets(authHeaders, scanId)])
      .then(([row, assetRows]) => {
        if (!cancelled) {
          setFinding(row);
          setAssets(assetRows);
        }
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

  if (loading) return <p className="text-slate-500">Loading issue details…</p>;

  if (error || !finding) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error || "Issue not found"}
      </div>
    );
  }

  const region = resourceRegion(finding, assets);
  const consoleUrl = awsConsoleUrl(finding);
  const cli = awsCliFix(finding);
  const tf = terraformFix(finding);
  const cfn = cloudformationFix(finding);
  const frameworks = frameworkTags(finding);
  const cis = cisControl(finding);

  return (
    <div className="space-y-6">
      <header>
        <Link to={`/scans/${scanId}`} className="text-sm text-indigo-600 hover:underline">
          ← Back to scan report
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{riskHeadline(finding)}</h1>
          <SeverityBadge severity={finding.severity} />
        </div>
      </header>

      {/* Risk summary card */}
      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <p className="text-sm font-medium text-red-800">Risk</p>
        <p className="mt-1 text-lg text-slate-900">{riskSummary(finding)}</p>
        <p className="mt-3 text-sm text-slate-700">
          <strong>Business impact:</strong> {businessImpact(finding)}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailCard label="Affected resource" value={finding.affected_resource} />
        <DetailCard label="Resource type" value={finding.resource_type_label} />
        <DetailCard label="Region" value={region} />
        <DetailCard label="Severity" value={finding.severity} capitalize />
        <DetailCard label="Estimated fix" value={`${estimatedFixMinutes(finding)} minutes`} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Why this matters</h2>
        <p className="mt-2 text-slate-700">
          {finding.description ?? riskSummary(finding)}
          {cis && (
            <span className="mt-2 block text-sm text-slate-500">This fails {cis}.</span>
          )}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">How to fix</h2>
        <p className="mt-2 text-slate-800">{fixInstruction(finding)}</p>
        {cli && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-slate-400">AWS CLI</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
              {cli}
            </pre>
          </div>
        )}
        {tf && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-slate-400">Terraform</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 whitespace-pre-wrap">
              {tf}
            </pre>
          </div>
        )}
        {cfn && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-slate-400">CloudFormation</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100 whitespace-pre-wrap">
              {cfn}
            </pre>
          </div>
        )}
        {consoleUrl && (
          <a
            href={consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Open in AWS Console
          </a>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Evidence</h2>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
          {formatEvidenceSummary(finding)}
        </pre>
      </section>

      {frameworks.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Frameworks</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {frameworks.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={() => setShowTechnical((v) => !v)}
          className="w-full px-5 py-3 text-left text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          {showTechnical ? "Hide" : "Show"} technical details
        </button>
        {showTechnical && (
          <div className="border-t border-slate-200 px-5 py-4 text-sm">
            <p>
              <span className="text-slate-400">Technical title:</span>{" "}
              {finding.technical_title}
            </p>
            <p className="mt-2">
              <span className="text-slate-400">Policy ID:</span>{" "}
              <code className="font-mono">{finding.policy_id}</code>
            </p>
            <p className="mt-2">
              <span className="text-slate-400">Resource ID:</span>{" "}
              <code className="break-all font-mono text-xs">{finding.resource_id}</code>
            </p>
            <p className="mt-2">
              <span className="text-slate-400">Evaluated:</span> {formatDate(finding.evaluated_at)}
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-white p-3 text-xs">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}

function DetailCard({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-medium text-slate-900 ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}
