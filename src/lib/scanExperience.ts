import type { AuthHeaders } from "./api";
import {
  ApiError,
  getScanCompliance,
  getScanFixPriorities,
  getScanRiskSummary,
  listFindings,
} from "./api";
import {
  estimatedFixMinutes,
  prioritizedFindings,
  resourceDisplayName,
  riskHeadline,
  riskSummary,
  severityCounts,
  uniqueIssuesByPolicy,
} from "./securityPresentation";
import type { FixPriorityItem, ScanRiskSummary } from "../types/platform";

/** Load customer experience data; fall back to legacy APIs if backend is not upgraded yet. */
export async function loadScanExperience(
  auth: AuthHeaders,
  scanId: string,
): Promise<{ summary: ScanRiskSummary; priorities: FixPriorityItem[] }> {
  try {
    const [summary, priorities] = await Promise.all([
      getScanRiskSummary(auth, scanId),
      getScanFixPriorities(auth, scanId, 100),
    ]);
    return { summary, priorities };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status >= 500)) {
      return buildLegacyScanExperience(auth, scanId);
    }
    throw e;
  }
}

async function buildLegacyScanExperience(
  auth: AuthHeaders,
  scanId: string,
): Promise<{ summary: ScanRiskSummary; priorities: FixPriorityItem[] }> {
  const [comp, findings] = await Promise.all([
    getScanCompliance(auth, scanId),
    listFindings(auth, scanId, { result: "fail" }),
  ]);
  const fails = findings.filter((f) => f.result === "fail");
  const sev = severityCounts(fails);

  const summary: ScanRiskSummary = {
    score: comp.score,
    total_findings: fails.length,
    critical: sev.critical,
    high: sev.high,
    medium: sev.medium,
    low: sev.low,
    info: sev.info,
    top_risks: uniqueIssuesByPolicy(fails).slice(0, 5).map((f) => ({
      finding_id: f.id,
      policy_id: f.policy_id,
      title: riskHeadline(f),
      technical_title: f.technical_title ?? f.title,
      severity: f.severity,
      affected_resource: resourceDisplayName(f),
      resource_type: f.resource_type,
      why_it_matters: riskSummary(f),
      business_impact: f.remediation?.business_impact ?? null,
      estimated_fix_minutes: estimatedFixMinutes(f),
    })),
  };

  const priorities: FixPriorityItem[] = prioritizedFindings(fails).map((f, i) => ({
    rank: i + 1,
    finding_id: f.id,
    policy_id: f.policy_id,
    display_title: riskHeadline(f),
    technical_title: f.technical_title ?? f.title,
    severity: f.severity,
    affected_resource: resourceDisplayName(f),
    resource_id: f.resource_id,
    resource_type: f.resource_type,
    why_it_matters: riskSummary(f),
    business_impact: f.remediation?.business_impact ?? null,
    estimated_fix_minutes: estimatedFixMinutes(f),
    frameworks: [],
    internet_exposed: false,
    data_sensitive: false,
  }));

  return { summary, priorities };
}
