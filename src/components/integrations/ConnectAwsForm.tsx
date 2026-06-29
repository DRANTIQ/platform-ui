import { useState, type FormEvent } from "react";
import { AwsSetupGuide } from "./AwsSetupGuide";
import { AwsTrustPanel } from "../welcome/AwsTrustPanel";
import { FieldTooltip } from "../welcome/FieldTooltip";
import type { AuthHeaders } from "../../lib/api";
import { createAwsIntegration } from "../../lib/api";
import {
  AWS_COMMERCIAL_REGIONS,
  CONNECT_VALIDATION_STEPS,
  generateExternalId,
  parseAccountIdFromRoleArn,
} from "../../lib/awsOnboarding";

type ConnectAwsFormProps = {
  authHeaders: AuthHeaders;
  onSuccess: () => void | Promise<void>;
  variant?: "page" | "panel";
  showStepLabel?: boolean;
  submitLabel?: string;
};

export function ConnectAwsForm({
  authHeaders,
  onSuccess,
  variant = "page",
  showStepLabel = false,
  submitLabel = "Connect AWS account",
}: ConnectAwsFormProps) {
  const [externalId, setExternalId] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [scanAllRegions, setScanAllRegions] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["us-east-1", "us-west-2"]);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [validationStep, setValidationStep] = useState(0);

  const parsedAccountId = parseAccountIdFromRoleArn(roleArn);
  const accountId = parsedAccountId || "";

  const shellClass =
    variant === "page"
      ? "rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      : "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

  function toggleRegion(region: string) {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (externalId.trim().length < 8) {
      setError("External ID must be at least 8 characters — use the same value you set in AWS.");
      return;
    }
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
        external_id: externalId.trim(),
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
        Estimated time: <strong>10–15 minutes</strong>. Deploy a read-only role in your account,
        then register it here.
      </p>

      <div className="mt-5">
        <AwsTrustPanel />
      </div>

      <div className="mt-6">
        <AwsSetupGuide />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 border-t border-slate-100 pt-8">
        <h3 className="text-sm font-semibold text-slate-900">Register your role in Drantiq</h3>

        <label className="block text-sm">
          <FieldTooltip
            label="External ID"
            hint="The secret you chose when deploying the template. Must match exactly what is in your IAM role trust policy."
          />
          <div className="mt-2 flex gap-2">
            <input
              required
              minLength={8}
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setExternalId(generateExternalId())}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Suggest
            </button>
          </div>
          <span className="mt-1 block text-xs text-slate-500">
            You define this — use the same value in AWS and here.
          </span>
        </label>

        <label className="relative block text-sm">
          <FieldTooltip
            label="Role ARN"
            hint="CloudFormation → your stack → Outputs → RoleArn."
          />
          <input
            required
            minLength={20}
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            placeholder="arn:aws:iam::123456789012:role/DrantiqReadOnly"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm"
          />
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
          type="submit"
          disabled={!roleArn.trim() || externalId.trim().length < 8}
          className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
