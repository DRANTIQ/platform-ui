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
  error?: Record<string, unknown> | null;
};

export type Integration = {
  id: string;
  tenant_id: string;
  provider: string;
  account_id: string;
  role_arn: string;
  regions: string[];
  status: string;
  created_at: string;
  updated_at: string;
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
  description: string | null;
  evidence: Record<string, unknown>;
  evaluated_at: string;
  created_at: string;
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
  domain: string | null;
  mapped_policy_ids: string[];
  fail_count: number;
  pass_count: number;
  finding_ids: string[];
  evidence: Record<string, unknown>;
  evaluated_at: string;
};

export type ScanCompliance = {
  framework_id: string;
  framework_title: string;
  version_label: string;
  scan_id: string;
  score: number;
  summary: Record<string, number>;
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
  auth_mode: string;
};
