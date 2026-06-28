import type { Asset, Finding, FindingRemediation, TimelineEvent } from "../types/platform";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export const RESOURCE_TYPE_LABEL: Record<string, string> = {
  "storage.bucket": "S3 Bucket",
  "storage.filesystem": "EFS File System",
  "network.vpc": "VPC",
  "network.security_group": "Security Group",
  "network.nacl": "Network ACL",
  "governance.trail": "CloudTrail",
  "governance.config": "AWS Config",
  "governance.hub": "Security Hub",
  "identity.account": "Account Setting",
  "identity.user": "IAM User",
  "identity.certificate": "IAM Certificate",
  "compute.instance": "EC2 Instance",
  "database.instance": "RDS Instance",
  "security.key": "KMS Key",
};

const TIMELINE_LABELS: Record<string, string> = {
  scan: "Scan started",
  "collection.started": "Collecting AWS resources",
  "collection.completed": "Resources collected",
  "inventory.updated": "Building resource inventory",
  "policy.evaluate": "Evaluating security policies",
  "policy.completed": "Security evaluation complete",
  "compliance.updated": "Calculating compliance score",
  "scan.completed": "Scan completed",
};

function rem(finding: Finding): FindingRemediation | undefined {
  return finding.remediation;
}

export function riskHeadline(finding: Finding): string {
  return rem(finding)?.headline ?? finding.title;
}

export function riskSummary(finding: Finding): string {
  return (
    rem(finding)?.risk_summary ??
    finding.description ??
    "This configuration increases your attack surface."
  );
}

export function businessImpact(finding: Finding): string {
  return (
    rem(finding)?.business_impact ??
    "This misconfiguration may lead to unauthorized access or compliance failure."
  );
}

export function fixInstruction(finding: Finding): string {
  return (
    rem(finding)?.fix_summary ??
    "Review the affected resource in AWS and apply the recommended security control."
  );
}

export function frameworkTags(finding: Finding): string[] {
  return rem(finding)?.framework_mappings ?? [];
}

export function cisControl(finding: Finding): string | null {
  const tags = frameworkTags(finding);
  const cis = tags.find((t) => t.startsWith("CIS "));
  return cis ?? null;
}

export function estimatedFixMinutes(finding: Finding): number {
  const fromApi = rem(finding)?.estimated_fix_minutes;
  if (fromApi != null) return fromApi;
  return { critical: 5, high: 5, medium: 3, low: 2, info: 2 }[finding.severity] ?? 3;
}

export function resourceLabel(resourceType: string): string {
  return RESOURCE_TYPE_LABEL[resourceType] ?? resourceType.replace(/\./g, " ");
}

export function resourceDisplayName(finding: Finding): string {
  const ev = finding.evidence ?? {};
  const props = (ev.properties as Record<string, unknown>) ?? ev;
  const name =
    props.name ??
    props.bucket_name ??
    props.trail_name ??
    props.vpc_id ??
    props.id;
  if (typeof name === "string" && name.length > 0) return name;
  const tail = finding.resource_id.split("/").pop() ?? finding.resource_id;
  return tail.length > 48 ? `${tail.slice(0, 45)}…` : tail;
}

export function resourceRegion(finding: Finding, assets?: Asset[]): string {
  const ev = finding.evidence ?? {};
  const props = (ev.properties as Record<string, unknown>) ?? ev;
  if (typeof props.region === "string") return props.region;
  const match = assets?.find((a) => a.resource_id === finding.resource_id);
  return match?.region ?? "global";
}

export function severityCounts(findings: Finding[]): Record<string, number> {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings.filter((x) => x.result === "fail")) {
    const s = f.severity as keyof typeof counts;
    if (s in counts) counts[s]++;
  }
  return counts;
}

export function totalFixMinutes(findings: Finding[]): number {
  return findings
    .filter((f) => f.result === "fail")
    .reduce((sum, f) => sum + estimatedFixMinutes(f), 0);
}

export function prioritizedFindings(findings: Finding[]): Finding[] {
  return [...findings]
    .filter((f) => f.result === "fail")
    .sort((a, b) => {
      const sa = SEVERITY_ORDER[a.severity] ?? 99;
      const sb = SEVERITY_ORDER[b.severity] ?? 99;
      if (sa !== sb) return sa - sb;
      return a.policy_id.localeCompare(b.policy_id);
    });
}

export function uniqueIssuesByPolicy(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const out: Finding[] = [];
  for (const f of prioritizedFindings(findings)) {
    if (seen.has(f.policy_id)) continue;
    seen.add(f.policy_id);
    out.push(f);
  }
  return out;
}

export function accountRiskSummary(failCount: number, severity: Record<string, number>): string {
  if (failCount === 0) return "No open security issues detected in your latest scan.";
  const parts: string[] = [];
  if (severity.critical) parts.push("data leakage");
  if (severity.high) parts.push("unauthorized access");
  if (severity.medium && !severity.critical && !severity.high) parts.push("audit gaps");
  if (parts.length === 0) parts.push("configuration gaps");
  return `Your account may be exposed to ${parts.join(" and ")}.`;
}

export function formatEvidenceSummary(finding: Finding): string {
  const ev = finding.evidence ?? {};
  const props = (ev.properties as Record<string, unknown>) ?? ev;
  const entries = Object.entries(props).filter(([k]) => !k.startsWith("_"));
  if (entries.length === 0) return "See technical evidence below.";
  return entries
    .slice(0, 4)
    .map(([k, v]) => `${k} = ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join("\n");
}

export function awsConsoleUrl(finding: Finding, _accountId?: string): string | null {
  const region = resourceRegion(finding);
  const r = region === "global" ? "us-east-1" : region;
  const name = resourceDisplayName(finding);
  switch (finding.resource_type) {
    case "storage.bucket":
      return `https://s3.console.aws.amazon.com/s3/buckets/${encodeURIComponent(name)}?region=${r}&tab=permissions`;
    case "governance.trail":
      return `https://${r}.console.aws.amazon.com/cloudtrail/home?region=${r}#/trails/${encodeURIComponent(name)}`;
    case "governance.config":
      return `https://${r}.console.aws.amazon.com/config/home?region=${r}`;
    case "governance.hub":
      return `https://${r}.console.aws.amazon.com/securityhub/home?region=${r}`;
    case "network.vpc":
      return `https://${r}.console.aws.amazon.com/vpc/home?region=${r}#vpcs:`;
    case "network.security_group":
      return `https://${r}.console.aws.amazon.com/vpc/home?region=${r}#SecurityGroups:`;
    case "network.nacl":
      return `https://${r}.console.aws.amazon.com/vpc/home?region=${r}#acls:`;
    case "identity.account":
      return `https://${r}.console.aws.amazon.com/ec2/home?region=${r}#Settings:`;
    default:
      return `https://${r}.console.aws.amazon.com/console/home?region=${r}`;
  }
}

export function awsCliFix(finding: Finding): string | null {
  return rem(finding)?.aws_cli ?? null;
}

export function terraformFix(finding: Finding): string | null {
  return rem(finding)?.terraform ?? null;
}

export function cloudformationFix(finding: Finding): string | null {
  return rem(finding)?.cloudformation ?? null;
}

export function groupAssetsByType(assets: Asset[]): { label: string; type: string; count: number; items: Asset[] }[] {
  const map = new Map<string, Asset[]>();
  for (const a of assets) {
    const list = map.get(a.resource_type) ?? [];
    list.push(a);
    map.set(a.resource_type, list);
  }
  return [...map.entries()]
    .map(([type, items]) => ({
      type,
      label: resourceLabel(type),
      count: items.length,
      items,
    }))
    .sort((a, b) => b.count - a.count);
}

export function assetHealth(
  asset: Asset,
  findings: Finding[],
): "healthy" | "attention" | "critical" {
  const related = findings.filter(
    (f) => f.result === "fail" && f.resource_id === asset.resource_id,
  );
  if (related.some((f) => f.severity === "critical" || f.severity === "high")) return "critical";
  if (related.some((f) => f.result === "fail")) return "attention";
  return "healthy";
}

export function customerTimeline(events: TimelineEvent[]): { label: string; at: string | null }[] {
  const skip = new Set(["inventory.updated", "collection.completed"]);
  const mapped: { label: string; at: string | null }[] = [];
  for (const ev of events) {
    const stage = String(ev.stage ?? ev.event_type ?? "");
    if (skip.has(stage)) continue;
    const label = TIMELINE_LABELS[stage] ?? stage.replace(/\./g, " ");
    mapped.push({ label, at: (ev.at as string) ?? ev.created_at ?? null });
  }
  return mapped;
}

export function scanDurationLabel(started: string | null, completed: string | null): string | null {
  if (!started || !completed) return null;
  const ms = new Date(completed).getTime() - new Date(started).getTime();
  if (ms < 0) return null;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec} seconds`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem ? `${min} minute${min !== 1 ? "s" : ""} ${rem} seconds` : `${min} minute${min !== 1 ? "s" : ""}`;
}
