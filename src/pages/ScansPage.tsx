import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEnvironmentScope } from "../contexts/EnvironmentScopeContext";
import { EnvironmentScopeSelect } from "../components/layout/EnvironmentScopeSelect";
import { createScan, listScans } from "../lib/api";
import { formatDate, formatRelativeTime } from "../lib/format";
import {
  isSpecificIntegrationFilter,
  providerBadgeLabel,
  scanAccountLabel,
  scanMatchesFilter,
  scopeDisplayLabel,
} from "../lib/integrationDisplay";
import { copy } from "../lib/productCopy";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Scan } from "../types/platform";

export function ScansPage() {
  const { authHeaders, canWrite } = useAuth();
  const navigate = useNavigate();
  const {
    scope,
    integrations,
    integrationsById,
    refreshIntegrations,
    isSingleAccount,
  } = useEnvironmentScope();
  const [scans, setScans] = useState<Scan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const filteredScans = useMemo(
    () => scans.filter((scan) => scanMatchesFilter(scan, scope, integrationsById)),
    [scans, scope, integrationsById],
  );

  const runIntegrationId = useMemo(() => {
    if (isSpecificIntegrationFilter(scope)) return scope;
    const active = integrations.filter((row) => row.status === "active");
    if (scope === "provider:aws") return active.find((row) => row.provider === "aws")?.id ?? "";
    if (scope === "provider:azure") return active.find((row) => row.provider === "azure")?.id ?? "";
    return active[0]?.id ?? "";
  }, [scope, integrations]);

  const canRunScan = isSpecificIntegrationFilter(scope)
    ? integrationsById.get(scope)?.status === "active"
    : Boolean(runIntegrationId);

  const refresh = useCallback(async () => {
    const scanRows = await listScans(authHeaders);
    setScans(scanRows);
    await refreshIntegrations();
  }, [authHeaders, refreshIntegrations]);

  useEffect(() => {
    refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load scans"))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function handleRunScan() {
    if (!integrations.length) {
      setError("No cloud integration registered for this tenant");
      return;
    }
    if (!canRunScan || !runIntegrationId) {
      setError("Select a specific cloud account to run a new assessment");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const scan = await createScan(authHeaders, runIntegrationId);
      await refresh();
      navigate(`/scans/${scan.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start scan");
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading scans…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Security assessments</h1>
          <p className="text-sm text-slate-500">
            {scopeDisplayLabel(scope, integrations)} · Run {copy.productName.toLowerCase()} on your
            cloud environments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EnvironmentScopeSelect />
          {canWrite && integrations.length > 0 && (
            <button
              type="button"
              onClick={handleRunScan}
              disabled={running || !canRunScan}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {running ? copy.scanning : copy.runAssessment}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {!integrations.length && canWrite && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Connect a cloud account before running a scan.{" "}
          <Link to="/integrations" className="font-medium text-indigo-600 hover:underline">
            Go to Integrations
          </Link>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredScans.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  {integrations.length === 0 ? (
                    <>
                      Connect AWS or Azure to begin your first security assessment.{" "}
                      <Link to="/integrations" className="font-medium text-indigo-600 hover:underline">
                        Connect cloud account
                      </Link>
                    </>
                  ) : scans.length === 0 ? (
                    <>
                      Run your first scan to identify cloud security risks.{" "}
                      <button
                        type="button"
                        onClick={handleRunScan}
                        disabled={!canRunScan}
                        className="font-medium text-indigo-600 hover:underline disabled:text-slate-400"
                      >
                        {copy.runAssessment}
                      </button>
                    </>
                  ) : (
                    <>No assessments match this environment.</>
                  )}
                </td>
              </tr>
            )}
            {filteredScans.map((scan) => {
              const integration = integrationsById.get(scan.integration_id);
              const provider = scan.provider ?? integration?.provider;
              return (
                <tr key={scan.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/scans/${scan.id}`} className="font-medium text-indigo-600 hover:underline">
                      {formatRelativeTime(scan.completed_at ?? scan.started_at ?? scan.created_at)}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {formatDate(scan.completed_at ?? scan.started_at ?? scan.created_at)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {provider && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {providerBadgeLabel(provider)}
                        </span>
                      )}
                      <span className="font-mono text-slate-600">
                        {scanAccountLabel(scan, integration)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isSingleAccount && filteredScans.length > 0 && (
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
            Showing {filteredScans.length} of {scans.length} assessments
          </p>
        )}
      </div>

      {canWrite && integrations.length > 0 && !isSpecificIntegrationFilter(scope) && (
        <p className="text-sm text-slate-500">
          To run a new assessment on one account, choose that account in the environment selector.
        </p>
      )}
    </div>
  );
}
