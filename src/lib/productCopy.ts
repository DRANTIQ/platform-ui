/**
 * Customer-facing product language (ADR-015).
 * Cloud security platform — compliance is one lens, not the product identity.
 * Internal API identifiers (policy_id, framework_id) stay technical in collapsed UI only.
 */

export const copy = {
  productName: "Drantiq Cloud Security",
  brandName: "Drantiq",

  runAssessment: "Run security assessment",
  runFirstAssessment: "Run first assessment",
  scanning: "Running assessment…",

  securityScore: "Security score",
  overallSecurityScore: "Overall security score",

  /** Customer-facing term for automated policy rules (never "checks" in UI). */
  securityControl: "Security control",
  securityControlId: "Control ID",
  securityControlVersion: "Control version",
  securityFinding: "Security risk",
  securityFindings: "Security risks",
  openIssues: "Open risks",

  cloudResources: "Cloud resources",
  resourcesProtected: "Protected",
  resourcesAtRisk: "At risk",
  openRisks: "Risks",
  immediateAction: "Immediate action",
  yourEnvironment: "Your environment",
  whyThisMatters: "Why this matters",
  howToFix: "How to fix",
  riskSignals: "Risk signals",
  criticalRisks: "Critical risks",
  highRisks: "High risks",
  topPriorities: "Top priorities",

  frameworkCoverage: "Compliance coverage",
  complianceLens: "Compliance lens",
  coverageAutomated: "Automated",
  coverageManual: "Manual",
  coverageNotAssessed: "Not assessed",
  coverageAtRisk: "At risk",
  viewRequirementDetails: "View requirement details",

  allRequirements: "Requirement details",
  requirementColumn: "Requirement",

  relatedResources: "Related resources",
  affectedResource: "Affected resource",
  riskScore: "Risk score",

  scansNav: "Assessments",
  scanReport: "Security assessment report",
  backToReport: "Back to assessment report",

  disclaimer:
    "Drantiq is a cloud security platform. Compliance mappings are one feature for reference — they do not constitute certification or attestation by any standards body.",

  defaultFrameworkDisplayTitle: "Drantiq Cloud Security",
} as const;

/** Strip third-party framework branding from API-provided titles shown to customers. */
export function customerFrameworkTitle(apiTitle: string | undefined | null): string {
  if (!apiTitle) return copy.defaultFrameworkDisplayTitle;
  if (/cis/i.test(apiTitle)) return copy.defaultFrameworkDisplayTitle;
  return apiTitle;
}

/** Framework hint tags safe for customer UI (excludes CIS and similar licensed labels). */
export function customerFrameworkTags(tags: string[]): string[] {
  return tags.filter((tag) => !/^\s*CIS\b/i.test(tag) && !/\bCIS\b/i.test(tag));
}
