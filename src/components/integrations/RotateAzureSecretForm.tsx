import { useState, type FormEvent } from "react";
import type { AuthHeaders } from "../../lib/api";
import { rotateAzureIntegrationSecret } from "../../lib/api";

type RotateAzureSecretFormProps = {
  authHeaders: AuthHeaders;
  integrationId: string;
  subscriptionId: string;
  onSuccess: () => void | Promise<void>;
};

export function RotateAzureSecretForm({
  authHeaders,
  integrationId,
  subscriptionId,
  onSuccess,
}: RotateAzureSecretFormProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (clientSecret.trim().length < 8) {
      setError("Client secret must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await rotateAzureIntegrationSecret(authHeaders, integrationId, {
        client_secret: clientSecret.trim(),
      });
      setClientSecret("");
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update client secret");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-amber-950">Fix Azure connection</h3>
      <p className="mt-1 text-sm text-amber-900">
        Credentials for subscription <span className="font-mono">{subscriptionId}</span> are
        invalid or expired. Paste a new client secret from Entra ID — no need to recreate the
        integration.
      </p>
      {error && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="font-medium text-slate-700">New client secret</span>
          <input
            required
            type="password"
            minLength={8}
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="••••••••••••"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || clientSecret.trim().length < 8}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Verifying…" : "Update secret"}
        </button>
      </form>
    </div>
  );
}
