import type { Integration } from "../types/platform";

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
