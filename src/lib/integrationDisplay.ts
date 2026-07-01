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
