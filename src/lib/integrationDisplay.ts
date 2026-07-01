import type { Integration, Scan } from "../types/platform";

export const SCAN_FILTER_ALL = "all";
export const SCAN_FILTER_AWS = "provider:aws";
export const SCAN_FILTER_AZURE = "provider:azure";

export function integrationLabel(integration: Integration): string {
  const account = integration.account_id;
  const status = integration.status;
  if (integration.provider === "azure") {
    return `Azure · ${account} (${status})`;
  }
  return `AWS · ${account} (${status})`;
}

export function providerBadgeLabel(provider: string): string {
  if (provider === "azure") return "Azure";
  if (provider === "aws") return "AWS";
  return provider.toUpperCase();
}

export function integrationSecondaryLine(integration: Integration): string {
  if (integration.provider === "azure") {
    const tenant = integration.azure_tenant_id ?? "—";
    const client = integration.azure_client_id ?? "—";
    return `Tenant ${tenant} · App ${client}`;
  }
  return integration.role_arn ?? "—";
}

export function accountScopeLabel(provider?: string | null): string {
  if (provider === "azure") return "Azure subscription";
  return "AWS account";
}

export function formatScanError(error: Record<string, unknown> | null | undefined): string | null {
  if (!error) return null;
  const message = error.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  try {
    return JSON.stringify(error);
  } catch {
    return "Scan failed — see the Timeline tab for details.";
  }
}

/** Fallback when GET /v1/scans/{id} has no provider (older API deploy). */
export function inferScanProvider(scan: {
  provider?: string | null;
  account_id?: string | null;
}): string {
  if (scan.provider) return scan.provider;
  if (scan.account_id && /^\d{12}$/.test(scan.account_id)) return "aws";
  if (scan.account_id && /^[0-9a-f-]{36}$/i.test(scan.account_id)) return "azure";
  return "aws";
}

export function scanMatchesFilter(
  scan: Scan,
  filterKey: string,
  integrationsById: Map<string, Integration>,
): boolean {
  if (filterKey === SCAN_FILTER_ALL) return true;
  const provider = scan.provider ?? integrationsById.get(scan.integration_id)?.provider;
  if (filterKey === SCAN_FILTER_AWS) return provider === "aws";
  if (filterKey === SCAN_FILTER_AZURE) return provider === "azure";
  return scan.integration_id === filterKey;
}

export function scanAccountLabel(
  scan: Scan,
  integration?: Integration,
): string {
  return scan.account_id ?? integration?.account_id ?? "—";
}

export function isSpecificIntegrationFilter(filterKey: string): boolean {
  return (
    filterKey !== SCAN_FILTER_ALL &&
    filterKey !== SCAN_FILTER_AWS &&
    filterKey !== SCAN_FILTER_AZURE
  );
}

export function integrationMatchesFilter(integration: Integration, filterKey: string): boolean {
  if (filterKey === SCAN_FILTER_ALL) return true;
  if (filterKey === SCAN_FILTER_AWS) return integration.provider === "aws";
  if (filterKey === SCAN_FILTER_AZURE) return integration.provider === "azure";
  return integration.id === filterKey;
}

export function scopeDisplayLabel(scope: string, integrations: Integration[]): string {
  if (scope === SCAN_FILTER_ALL) return "All accounts";
  if (scope === SCAN_FILTER_AWS) return "All AWS";
  if (scope === SCAN_FILTER_AZURE) return "All Azure";
  const integration = integrations.find((row) => row.id === scope);
  if (!integration) return "Account";
  if (integration.provider === "azure") {
    return `Azure · ${integration.account_id}`;
  }
  return `AWS · ${integration.account_id}`;
}

export function latestScanForIntegration(scans: Scan[], integrationId: string): Scan | undefined {
  return scans.find((scan) => scan.integration_id === integrationId);
}

export function latestCompletedScanForIntegration(scans: Scan[], integrationId: string): Scan | undefined {
  return scans.find(
    (scan) =>
      scan.integration_id === integrationId &&
      (scan.status === "completed" || scan.status === "completed_with_errors"),
  );
}
