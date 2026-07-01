import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { RiskSignalBadges } from "../components/security/RiskSignalBadges";
import { SeverityBadge } from "../components/security/SeverityBadge";
import { getFinding, listAssets } from "../lib/api";
import { formatDate } from "../lib/format";
import {
  awsCliFix,
  awsConsoleUrl,
  businessImpact,
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
import { copy, customerFrameworkTags } from "../lib/productCopy";
import { scoreDisplay } from "../lib/riskScore";
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

  if (loading) return <p className="text-slate-500">Loading risk details…</p>;

  if (error || !finding) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error || "Risk not found"}
      </div>
    );
  }

  const region = resourceRegion(finding, assets);
  const consoleUrl = awsConsoleUrl(finding);
  const cli = awsCliFix(finding);
  const tf = terraformFix(finding);
  const cfn = cloudformationFix(finding);
  const frameworks = customerFrameworkTags(frameworkTags(finding));
  const signals = finding.risk_signals;
  const riskScore = signals?.risk_score;
  const related = finding.related_resources ?? [];
  const scoreText = riskScore != null ? scoreDisplay(riskScore) : null;

  return (
    <div className="space-y-6">
      <header>
        <Link to={`/scans/${scanId}`} className="text-sm text-indigo-600 hover:underline">
          ← {copy.backToReport}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{riskHeadline(finding)}</h1>
              <SeverityBadge severity={finding.severity} />
            </div>
            {scoreText && (
              <p className="mt-3 text-sm text-slate-500">
                {copy.riskScore}{" "}
                <span className="text-2xl font-bold text-slate-900">{scoreText.value}</span>{" "}
                <span className="font-semibold text-slate-600">{scoreText.label}</span>
              </p>
            )}
            {signals?.why_badges?.length ? (
              <div className="mt-4">
                <RiskSignalBadges badges={signals.why_badges} />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          {copy.whyThisMatters}
        </h2>
        <p className="mt-2 text-slate-800">{riskSummary(finding)}</p>
        <p className="mt-3 text-sm text-slate-700">
          <strong>Business impact:</strong> {businessImpact(finding)}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          {copy.affectedResource}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <DetailRow label="Resource" value={finding.affected_resource} />
          <DetailRow label="Type" value={finding.resource_type_label} />
          <DetailRow label="Region" value={region} />
          <DetailRow label="Estimated fix" value={`${estimatedFixMinutes(finding)} minutes`} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            {copy.relatedResources}
          </h2>
          <p className="mt-1 text-xs text-slate-500">Inventory relationships — not an attack path.</p>
          <ul className="mt-3 space-y-2">
            {related.map((rel) => (
              <li key={rel.resource_id} className="text-sm text-slate-700">
                <span className="font-medium">{rel.resource_name}</span>
                <span className="text-slate-400"> · {rel.relationship_type.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">{copy.howToFix}</h2>
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
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            {copy.complianceLens}
          </h2>
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
              <span className="text-slate-400">Technical title:</span> {finding.technical_title}
            </p>
            <p className="mt-2">
              <span className="text-slate-400">{copy.securityControlId}:</span>{" "}
              <code className="font-mono">{finding.policy_id}</code>
            </p>
            {finding.policy_version && (
              <p className="mt-2">
                <span className="text-slate-400">{copy.securityControlVersion}:</span>{" "}
                <code className="font-mono">{finding.policy_version}</code>
              </p>
            )}
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
