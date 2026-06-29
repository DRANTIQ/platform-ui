import { useMemo, useState, type FormEvent } from "react";
import { AwsTrustPanel } from "../welcome/AwsTrustPanel";
import { FieldTooltip } from "../welcome/FieldTooltip";
import type { AuthHeaders } from "../../lib/api";
import { createAwsIntegration } from "../../lib/api";
import {
  AWS_COMMERCIAL_REGIONS,
  buildCloudFormationLaunchUrl,
  CONNECT_VALIDATION_STEPS,
  generateExternalId,
  getOrCreateExternalId,
  parseAccountIdFromRoleArn,
} from "../../lib/awsOnboarding";

type ConnectAwsFormProps = {
  authHeaders: AuthHeaders;
  onSuccess: () => void | Promise<void>;
  /** Use session-persisted ID during onboarding; fresh ID when adding another account */
  externalIdMode?: "session" | "fresh";
  variant?: "page" | "panel";
  showStepLabel?: boolean;
  submitLabel?: string;
};

export function ConnectAwsForm({
  authHeaders,
  onSuccess,
  externalIdMode = "session",
  variant = "page",
  showStepLabel = false,
  submitLabel = "Connect AWS account",
}: ConnectAwsFormProps) {
  const externalId = useMemo(
    () => (externalIdMode === "fresh" ? generateExternalId() : getOrCreateExternalId()),
    [externalIdMode],
  );

  const [roleArn, setRoleArn] = useState("");
  const [scanAllRegions, setScanAllRegions] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["us-east-1", "us-west-2"]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [accountIdOverride, setAccountIdOverride] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [validationStep, setValidationStep] = useState(0);
  const [cfnLaunched, setCfnLaunched] = useState(false);

  const parsedAccountId = parseAccountIdFromRoleArn(roleArn);
  const accountId = accountIdOverride.trim() || parsedAccountId || "";

  const shellClass =
    variant === "page"
      ? "rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      : "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

  function toggleRegion(region: string) {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  }

  function handleLaunchCloudFormation() {
    window.open(buildCloudFormationLaunchUrl(externalId), "_blank", "noopener,noreferrer");
    setCfnLaunched(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId || accountId.length !== 12) {
      setError(
        "Paste your Role ARN from CloudFormation — we'll detect your account ID automatically.",
      );
      return;
    }
    const regionList = scanAllRegions ? [...AWS_COMMERCIAL_REGIONS] : selectedRegions;
    if (!regionList.length) {
      setError("Select at least one region.");
      return;
    }

    setConnecting(true);
    setError(null);
    setValidationStep(0);

    const stepTimer = window.setInterval(() => {
      setValidationStep((s) => Math.min(s + 1, CONNECT_VALIDATION_STEPS.length - 1));
    }, 900);

    try {
      await createAwsIntegration(authHeaders, {
        account_id: accountId,
        role_arn: roleArn.trim(),
        external_id: externalId,
        regions: regionList,
      });
      setValidationStep(CONNECT_VALIDATION_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 600));
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect AWS");
      setConnecting(false);
    } finally {
      window.clearInterval(stepTimer);
    }
  }

  if (connecting) {
    return (
      <div className={shellClass}>
        <h2 className="text-xl font-bold text-slate-900">Connecting your AWS account…</h2>
        <ul className="mt-6 space-y-3">
          {CONNECT_VALIDATION_STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  i < validationStep
                    ? "bg-emerald-100 text-emerald-700"
                    : i === validationStep
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < validationStep ? "✓" : i + 1}
              </span>
              <span className={i <= validationStep ? "text-slate-800" : "text-slate-400"}>
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {showStepLabel && (
        <p className="text-sm font-medium text-indigo-600">Step 2 of 4 · Connect AWS</p>
      )}
      <h2
        className={`font-bold text-slate-900 ${showStepLabel ? "mt-1 text-2xl" : "text-lg"}`}
      >
        Connect your AWS account securely
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Estimated time: <strong>2 minutes</strong>. We use a read-only IAM role — no agents, no
        changes to your infrastructure.
      </p>

      <AwsTrustPanel />

      <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>Launch our CloudFormation template in your AWS account</li>
        <li>AWS creates a secure read-only role (takes about 1 minute)</li>
        <li>Copy the <strong>Role ARN</strong> from the stack outputs</li>
        <li>Paste it below and click Connect</li>
      </ol>

      <button
        type="button"
        onClick={handleLaunchCloudFormation}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF9900] px-6 py-3.5 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-[#ec8800] sm:w-auto"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.08 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" />
        </svg>
        Launch CloudFormation in AWS
      </button>
      {cfnLaunched && (
        <p className="mt-2 text-sm text-emerald-700">
          CloudFormation opened in a new tab. When the stack completes, copy the Role ARN from
          Outputs.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 border-t border-slate-100 pt-8">
        <label className="relative block text-sm">
          <FieldTooltip
            label="Role ARN"
            hint="In AWS CloudFormation → your stack → Outputs tab → copy the RoleArn value."
          />
          <input
            required
            minLength={20}
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            placeholder="arn:aws:iam::123456789012:role/DrantiqReadOnly"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm"
          />
          {parsedAccountId && (
            <p className="mt-1.5 text-xs text-slate-500">
              Detected account ID: <span className="font-mono">{parsedAccountId}</span>
            </p>
          )}
        </label>

        <fieldset className="text-sm">
          <legend className="font-medium text-slate-700">Regions to scan</legend>
          <label className="mt-2 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={scanAllRegions}
              onChange={(e) => setScanAllRegions(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Scan all enabled commercial regions (recommended)</span>
          </label>
          {!scanAllRegions && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                {AWS_COMMERCIAL_REGIONS.map((region) => (
                  <label key={region} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(region)}
                      onChange={() => toggleRegion(region)}
                    />
                    {region}
                  </label>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          {advancedOpen ? "▼" : "▶"} Advanced settings
        </button>

        {advancedOpen && (
          <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
            <label className="block">
              <span className="font-medium text-slate-700">AWS account ID</span>
              <input
                value={accountIdOverride || parsedAccountId || ""}
                onChange={(e) => setAccountIdOverride(e.target.value)}
                placeholder="Auto-detected from Role ARN"
                pattern="[0-9]{12}"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
              />
            </label>
            <div>
              <span className="font-medium text-slate-700">External ID</span>
              <p className="mt-1 text-xs text-slate-500">
                Pre-configured in your CloudFormation stack. You don&apos;t need to enter this
                manually.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs">
                  {externalId}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(externalId)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!roleArn.trim()}
          className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
