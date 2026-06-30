/**
 * Customer-facing product language (ADR-015).
 * Internal API identifiers (policy_id, framework_id) stay technical — never lead with these in UI.
 */

export const copy = {
  productName: "Drantiq Security Assessment",
  brandName: "Drantiq",

  runAssessment: "Run security assessment",
  runFirstAssessment: "Run first assessment",
  scanning: "Running assessment…",

  securityScore: "Security score",
  overallSecurityScore: "Overall security score",

  securityCheck: "Security check",
  securityCheckId: "Check ID",
  securityFinding: "Security finding",
  securityFindings: "Security findings",
  openIssues: "Open issues",

  frameworkCoverage: "Framework coverage",
  allRequirements: "All security requirements",
  requirementColumn: "Requirement",

  scansNav: "Assessments",
  scanReport: "Security assessment report",
  backToReport: "Back to assessment report",

  disclaimer:
    "Drantiq performs independent security assessments. Framework mappings are for reference and do not constitute certification or attestation by any standards body.",

  /** Default display when API still returns a CIS-titled framework (until P2 backend rename). */
  defaultFrameworkDisplayTitle: "Drantiq Security Assessment",
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
