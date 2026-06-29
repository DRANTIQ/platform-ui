import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { createAwsIntegration, updateOnboardingState } from "../../lib/api";

const DEFAULT_REGIONS = "us-east-1,us-west-2";

export function ConnectAwsPage() {
  const { authHeaders } = useAuth();
  const navigate = useNavigate();
  const [accountId, setAccountId] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [externalId, setExternalId] = useState("");
  const [regions, setRegions] = useState(DEFAULT_REGIONS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const regionList = regions
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    try {
      await createAwsIntegration(authHeaders, {
        account_id: accountId.trim(),
        role_arn: roleArn.trim(),
        external_id: externalId.trim(),
        regions: regionList,
      });
      await updateOnboardingState(authHeaders, "AWS_CONNECTED");
      navigate("/welcome/scan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect AWS");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Connect your AWS account</h1>
      <p className="mt-2 text-sm text-slate-600">
        Drantiq uses read-only access via STS AssumeRole. Create a cross-account IAM role in your
        AWS account that trusts the platform.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">AWS account ID</span>
          <input
            required
            pattern="[0-9]{12}"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="123456789012"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Role ARN</span>
          <input
            required
            minLength={20}
            value={roleArn}
            onChange={(e) => setRoleArn(e.target.value)}
            placeholder="arn:aws:iam::123456789012:role/PlatformReadOnly"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">External ID</span>
          <input
            required
            minLength={8}
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Regions</span>
          <input
            required
            value={regions}
            onChange={(e) => setRegions(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Connecting…" : "Connect AWS account"}
          </button>
        </div>
      </form>
    </div>
  );
}
