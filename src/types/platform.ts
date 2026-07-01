export type Scan = {
  id: string;
  tenant_id: string;
  integration_id: string;
  status: string;
  trace_id: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  account_id?: string | null;
  collection_status?: string | null;
  provider?: string | null;
  error?: Record<string, unknown> | null;
};

export type Integration = {
  id: string;
  tenant_id: string;
  provider: string;
  account_id: string;
  role_arn?: string | null;
  azure_tenant_id?: string | null;
  azure_client_id?: string | null;
  regions: string[];
  status: string;
  created_at: string;
  updated_at: string;
};

export type FindingRemediation = {
  headline: string | null;
  risk_summary: string | null;
  business_impact: string | null;
  fix_summary: string | null;
  summary?: string | null;
  estimated_fix_minutes: number | null;
  estimated_minutes?: number | null;
  framework_mappings: string[];
  aws_cli: string | null;
  azure_cli?: string | null;
  azure_portal_steps?: string[];
  terraform: string | null;
  cloudformation: string | null;
  aws_console_steps?: string[];
};

export type FrameworkRef = {
  framework: string;
  control: string;
};

export type Finding = {
  id: string;
  policy_id: string;
  resource_id: string;
  resource_type: string;
  result: string;
  status: string;
  severity: string;
  title: string;
  display_title?: string | null;
  technical_title?: string | null;
  description: string | null;
  evidence: Record<string, unknown>;
  remediation?: FindingRemediation;
  evaluated_at: string;
  created_at: string;
};

export type FindingDetail = Finding & {
  plain_language_title: string;
  affected_resource: string;
  resource_type_label: string;
  risk: string | null;
  business_impact: string | null;
  frameworks: FrameworkRef[];
  policy_version?: string;
  risk_signals?: RiskSignals;
  related_resources?: RelatedResourceRef[];
};

export type TopRiskItem = {
  finding_id: string;
  policy_id: string;
  title: string;
  technical_title: string;
  severity: string;
  affected_resource: string;
  resource_type: string;
  why_it_matters: string | null;
  business_impact: string | null;
  estimated_fix_minutes: number | null;
  risk_score?: number;
};

export type ScanRiskSummary = {
  score: number | null;
  total_findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  top_risks: TopRiskItem[];
  cloud_resources?: number | null;
  resources_at_risk?: number | null;
  resources_protected?: number | null;
};

export type FixPriorityItem = {
  rank: number;
  finding_id: string;
  policy_id: string;
  display_title: string;
  technical_title: string;
  severity: string;
  affected_resource: string;
  resource_id: string;
  resource_type: string;
  why_it_matters: string | null;
  business_impact: string | null;
  estimated_fix_minutes: number | null;
  frameworks: FrameworkRef[];
  internet_exposed: boolean;
  data_sensitive: boolean;
  risk_score?: number;
};

export type ResourceRisk = {
  resource_id: string;
  risk_level: string;
  finding_count: number;
  findings: {
    finding_id: string;
    policy_id: string;
    display_title: string;
    technical_title: string;
    severity: string;
    remediation_summary: string | null;
  }[];
  display_titles: string[];
};

export type Asset = {
  resource_id: string;
  resource_type: string;
  provider: string;
  provider_type: string;
  account_id: string;
  region: string | null;
  properties: Record<string, unknown>;
  tags: Record<string, unknown>;
  collected_at: string;
  ingested_at: string;
};

export type ControlResult = {
  control_id: string;
  status: string;
  severity: string | null;
  title: string;
  display_title?: string | null;
  domain: string | null;
  mapped_policy_ids: string[];
  fail_count: number;
  pass_count: number;
  finding_ids: string[];
  evidence: Record<string, unknown>;
  evaluated_at: string;
};

export type ComplianceFramework = {
  framework_id: string;
  title: string;
  display_title?: string | null;
  provider: string;
  version_label: string;
  customer_visible?: boolean;
  requires_license?: boolean;
};

export type ComplianceCoverage = {
  total_checks?: number;
  assessed: number;
  automated: number;
  not_assessed: number;
  manual: number;
  pass: number;
  fail: number;
  pass_rate: number;
};

export type RelatedResourceRef = {
  resource_id: string;
  resource_name: string;
  resource_type: string;
  relationship_type: string;
};

export type RiskWhyBadge = {
  id: string;
  label: string;
};

export type RiskSignalsAssessed = {
  business_critical: boolean;
  lateral_movement: boolean;
  blast_radius: boolean;
};

export type RiskSignals = {
  risk_score: number;
  internet_exposed: boolean;
  data_sensitive: boolean;
  confidence: string;
  publicly_accessible: boolean;
  identity_exposure: boolean;
  business_critical: boolean;
  lateral_movement: boolean;
  blast_radius: boolean;
  why_badges: RiskWhyBadge[];
  assessed: RiskSignalsAssessed;
};

export type ScanCompliance = {
  framework_id: string;
  framework_title: string;
  display_title?: string | null;
  version_label: string;
  scan_id: string;
  score: number;
  summary: Record<string, number>;
  coverage?: ComplianceCoverage;
  evaluated_at: string;
  controls: ControlResult[];
};

export type TimelineEvent = {
  stage?: string;
  status?: string | null;
  at?: string | null;
  event_type?: string;
  created_at?: string;
  payload?: Record<string, unknown>;
};

export type MeResponse = {
  tenant_id: string;
  role: string;
  subject: string;
  email: string | null;
  user_id?: string | null;
  issuer?: string | null;
  auth_mode: string;
  workspace?: WorkspaceSummary | null;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  onboarding_state: string;
  plan: string;
  trial_end: string | null;
};

export type OnboardingState =
  | "WORKSPACE_CREATED"
  | "AWS_CONNECTED"
  | "AZURE_CONNECTED"
  | "CLOUD_CONNECTED"
  | "FIRST_SCAN_STARTED"
  | "FIRST_SCAN_COMPLETE"
  | "ONBOARDING_COMPLETE";

export type WorkspaceCreateResponse = {
  workspace: WorkspaceSummary;
  membership: { id: string; role: string; status: string };
  next_path: string;
};

export type Invitation = {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  invite_url?: string | null;
};

export type InvitationPreview = {
  email: string;
  role: string;
  status: string;
  workspace_name: string;
  expires_at: string;
};
