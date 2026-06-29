/** AWS onboarding helpers — customer-friendly connect flow */

export const DRANTIQ_HUB_ACCOUNT_ID =
  (import.meta.env.VITE_DRANTIQ_HUB_ACCOUNT_ID as string | undefined)?.trim() || "744698194074";

/** Public onboarding doc (GitHub or docs site). */
export const AWS_SETUP_DOC_URL =
  (import.meta.env.VITE_AWS_SETUP_DOC_URL as string | undefined)?.trim() ||
  "https://github.com/drantiq/compliance-engine/blob/main/docs/AWS_ACCOUNT_ONBOARDING.md";

export const AWS_COMMERCIAL_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ca-central-1",
  "sa-east-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "eu-south-1",
  "eu-south-2",
  "ap-south-1",
  "ap-south-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-southeast-3",
  "ap-southeast-4",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
  "ap-east-1",
  "me-south-1",
  "me-central-1",
  "af-south-1",
  "il-central-1",
] as const;

export function generateExternalId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `drq_${hex}`;
}

export function parseAccountIdFromRoleArn(arn: string): string | null {
  const match = arn.trim().match(/^arn:aws:iam::(\d{12}):role\/.+$/);
  return match?.[1] ?? null;
}

export function cloudFormationTemplateUrl(): string {
  const configured = (import.meta.env.VITE_CFN_TEMPLATE_URL as string | undefined)?.trim();
  if (configured) return configured;
  const origin = (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || window.location.origin;
  return `${origin.replace(/\/$/, "")}/cloudformation/drantiq-readonly-role.yaml`;
}

export function greetingFirstName(email: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (!parts.length) return null;
  let raw = parts[0].length <= 2 && parts.length > 1 ? parts[1] : parts[0];
  raw = raw.replace(/\d+/g, "");
  if (!raw) return null;
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export function welcomeTitle(email: string | null, workspaceName: string | null): string {
  const first = greetingFirstName(email);
  if (first) return `Welcome, ${first} 👋`;
  if (workspaceName) return `Welcome to ${workspaceName} 👋`;
  return "Welcome to Drantiq 👋";
}

export const SCAN_PROGRESS_STEPS = [
  { key: "validate", label: "Role validated" },
  { key: "iam", label: "Collecting IAM…" },
  { key: "s3", label: "Collecting S3…" },
  { key: "ec2", label: "Collecting EC2…" },
  { key: "policies", label: "Analyzing security policies…" },
  { key: "compliance", label: "Calculating compliance score…" },
  { key: "done", label: "Done" },
] as const;

export const CONNECT_VALIDATION_STEPS = [
  "Validating role…",
  "Verifying read-only access…",
  "Registering your AWS account…",
] as const;
