/** Azure subscription onboarding helpers */

export const AZURE_COMMON_LOCATIONS = [
  "eastus",
  "eastus2",
  "westus",
  "westus2",
  "westus3",
  "centralus",
  "northcentralus",
  "southcentralus",
  "westeurope",
  "northeurope",
  "uksouth",
  "ukwest",
  "francecentral",
  "germanywestcentral",
  "swedencentral",
  "norwayeast",
  "switzerlandnorth",
  "canadacentral",
  "canadaeast",
  "brazilsouth",
  "australiaeast",
  "australiasoutheast",
  "japaneast",
  "japanwest",
  "koreacentral",
  "southeastasia",
  "eastasia",
  "centralindia",
  "southindia",
  "uaenorth",
  "southafricanorth",
] as const;

const GUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const AZURE_SETUP_DOC_URL =
  (import.meta.env.VITE_AZURE_SETUP_DOC_URL as string | undefined)?.trim() ||
  "https://drantiq.ai/docs/azure-onboarding";

export function isAzureGuid(value: string): boolean {
  return GUID_RE.test(value.trim());
}

export function normalizeAzureGuid(value: string): string {
  return value.trim().toLowerCase();
}

export function armTemplateUrl(): string {
  const configured = (import.meta.env.VITE_ARM_TEMPLATE_URL as string | undefined)?.trim();
  if (configured) return configured;
  const origin =
    (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || window.location.origin;
  return `${origin.replace(/\/$/, "")}/arm/drantiq-readonly-sp.json`;
}

export const AZURE_CONNECT_VALIDATION_STEPS = [
  "Validating service principal…",
  "Verifying subscription access…",
  "Registering your Azure subscription…",
] as const;

export const AZURE_SCAN_PROGRESS_STEPS = [
  { key: "validate", label: "Credentials validated" },
  { key: "storage", label: "Collecting storage accounts…" },
  { key: "network", label: "Collecting network resources…" },
  { key: "compute", label: "Collecting compute & databases…" },
  { key: "policies", label: "Analyzing security policies…" },
  { key: "compliance", label: "Calculating security score…" },
  { key: "done", label: "Done" },
] as const;
