import { useState, type FormEvent } from "react";
import { AzureSetupGuide } from "./AzureSetupGuide";
import { FieldTooltip } from "../welcome/FieldTooltip";
import type { AuthHeaders } from "../../lib/api";
import { createAzureIntegration } from "../../lib/api";
import {
  AZURE_COMMON_LOCATIONS,
  AZURE_CONNECT_VALIDATION_STEPS,
  isAzureGuid,
  normalizeAzureGuid,
} from "../../lib/azureOnboarding";

type ConnectAzureFormProps = {
  authHeaders: AuthHeaders;
  onSuccess: () => void | Promise<void>;
  variant?: "page" | "panel";
  showStepLabel?: boolean;
  submitLabel?: string;
};

export function ConnectAzureForm({
  authHeaders,
  onSuccess,
  variant = "page",
  showStepLabel = false,
  submitLabel = "Connect Azure subscription",
}: ConnectAzureFormProps) {
  const [subscriptionId, setSubscriptionId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [scanAllLocations, setScanAllLocations] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["eastus", "westeurope"]);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [validationStep, setValidationStep] = useState(0);

  const shellClass =
    variant === "page"
      ? "rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      : "rounded-xl border border-slate-200 bg-white p-6 shadow-sm";

  function toggleLocation(location: string) {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isAzureGuid(subscriptionId)) {
      setError("Subscription ID must be a valid GUID.");
      return;
    }
    if (!isAzureGuid(tenantId)) {
      setError("Tenant ID must be a valid GUID.");
      return;
    }
    if (!isAzureGuid(clientId)) {
      setError("Client ID must be a valid GUID.");
      return;
    }
    if (clientSecret.trim().length < 8) {
      setError("Client secret must be at least 8 characters.");
      return;
    }
    const locations = scanAllLocations ? [...AZURE_COMMON_LOCATIONS] : selectedLocations;
    if (!locations.length) {
      setError("Select at least one Azure location.");
      return;
    }

    setConnecting(true);
    setError(null);
    setValidationStep(0);

    const stepTimer = window.setInterval(() => {
      setValidationStep((s) => Math.min(s + 1, AZURE_CONNECT_VALIDATION_STEPS.length - 1));
    }, 900);

    try {
      await createAzureIntegration(authHeaders, {
        subscription_id: normalizeAzureGuid(subscriptionId),
        azure_tenant_id: normalizeAzureGuid(tenantId),
        azure_client_id: normalizeAzureGuid(clientId),
        client_secret: clientSecret.trim(),
        locations,
      });
      setValidationStep(AZURE_CONNECT_VALIDATION_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 600));
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect Azure");
      setConnecting(false);
    } finally {
      window.clearInterval(stepTimer);
    }
  }

  if (connecting) {
    return (
      <div className={shellClass}>
        <h2 className="text-xl font-bold text-slate-900">Connecting your Azure subscription…</h2>
        <ul className="mt-6 space-y-3">
          {AZURE_CONNECT_VALIDATION_STEPS.map((label, i) => (
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
        <p className="text-sm font-medium text-indigo-600">Step 2 of 4 · Connect Azure</p>
      )}
      <h2 className={`font-bold text-slate-900 ${showStepLabel ? "mt-1 text-2xl" : "text-lg"}`}>
        Connect your Azure subscription securely
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Estimated time: <strong>10–15 minutes</strong>. Use a read-only service principal — Drantiq
        never modifies your resources.
      </p>

      <div className="mt-6">
        <AzureSetupGuide />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 border-t border-slate-100 pt-8">
        <h3 className="text-sm font-semibold text-slate-900">Register credentials in Drantiq</h3>

        <label className="block text-sm">
          <FieldTooltip
            label="Subscription ID"
            hint="Azure Portal → Subscriptions → copy the Subscription ID GUID."
          />
          <input
            required
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            placeholder="11111111-2222-3333-4444-555555555555"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm"
          />
        </label>

        <label className="block text-sm">
          <FieldTooltip
            label="Directory (tenant) ID"
            hint="Entra ID → App registration → Overview → Directory (tenant) ID."
          />
          <input
            required
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm"
          />
        </label>

        <label className="block text-sm">
          <FieldTooltip
            label="Application (client) ID"
            hint="Entra ID → App registration → Overview → Application (client) ID."
          />
          <input
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="ffffffff-1111-2222-3333-444444444444"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm"
          />
        </label>

        <label className="block text-sm">
          <FieldTooltip
            label="Client secret"
            hint="Certificates & secrets → New client secret. Stored encrypted — not shown again."
          />
          <input
            required
            type="password"
            minLength={8}
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="••••••••••••"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
            autoComplete="off"
          />
        </label>

        <fieldset className="text-sm">
          <legend className="font-medium text-slate-700">Locations to scan</legend>
          <label className="mt-2 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={scanAllLocations}
              onChange={(e) => setScanAllLocations(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Scan all common locations (recommended)</span>
          </label>
          {!scanAllLocations && (
            <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                {AZURE_COMMON_LOCATIONS.map((location) => (
                  <label key={location} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(location)}
                      onChange={() => toggleLocation(location)}
                    />
                    {location}
                  </label>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={
            !subscriptionId.trim() ||
            !tenantId.trim() ||
            !clientId.trim() ||
            clientSecret.trim().length < 8
          }
          className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto sm:px-8"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
