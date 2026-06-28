import type {
  Asset,
  ControlResult,
  Finding,
  FindingDetail,
  FixPriorityItem,
  Integration,
  MeResponse,
  ResourceRisk,
  Scan,
  ScanCompliance,
  ScanRiskSummary,
  TimelineEvent,
} from "../types/platform";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function parseApiError(text: string, fallback: string): string {
  try {
    const data = JSON.parse(text) as { detail?: unknown };
    const detail = data.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : String(d)))
        .join("; ");
    }
  } catch {
    /* plain text */
  }
  return text || fallback;
}

export type AuthHeaders = {
  tenantId: string;
  role: string;
  bearerToken?: string;
};

function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? "";
  if (!raw) {
    throw new ApiError(
      "VITE_API_URL is not configured. Set it in Vercel Environment Variables and redeploy.",
      0,
    );
  }
  const base = raw.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const uiOrigin = window.location.origin.replace(/\/$/, "");
    if (base === uiOrigin) {
      throw new ApiError(
        "VITE_API_URL must be your API host (e.g. https://api.drantiq.ai), not the UI domain.",
        0,
      );
    }
  }
  return base;
}

async function request<T>(
  auth: AuthHeaders,
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  },
): Promise<T> {
  const base = getApiBase();
  const url = new URL(path, `${base}/`);
  if (options?.params) {
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.bearerToken) {
    headers.Authorization = `Bearer ${auth.bearerToken}`;
  } else {
    headers["X-Tenant-ID"] = auth.tenantId;
    headers["X-Role"] = auth.role;
  }

  const res = await fetch(url.toString(), {
    method: options?.method ?? "GET",
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(parseApiError(text, res.statusText), res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function checkHealth(): Promise<{ status: string }> {
  return fetch(`${getApiBase()}/health`).then((r) => r.json());
}

export function getMe(auth: AuthHeaders): Promise<MeResponse> {
  return request(auth, "/v1/me");
}

export function listIntegrations(auth: AuthHeaders): Promise<Integration[]> {
  return request(auth, "/v1/integrations");
}

export type AwsIntegrationCreate = {
  account_id: string;
  role_arn: string;
  external_id: string;
  regions: string[];
};

export function createAwsIntegration(
  auth: AuthHeaders,
  body: AwsIntegrationCreate,
): Promise<Integration> {
  return request(auth, "/v1/integrations/aws", { method: "POST", body });
}

export function listScans(auth: AuthHeaders, limit = 50): Promise<Scan[]> {
  return request(auth, "/v1/scans", { params: { limit } });
}

export function getScan(auth: AuthHeaders, scanId: string): Promise<Scan> {
  return request(auth, `/v1/scans/${scanId}`);
}

export function createScan(auth: AuthHeaders, integrationId: string): Promise<Scan> {
  return request(auth, "/v1/scans", {
    method: "POST",
    body: { integration_id: integrationId },
  });
}

export function getScanTimeline(auth: AuthHeaders, scanId: string): Promise<TimelineEvent[]> {
  return request(auth, `/v1/scans/${scanId}/timeline`);
}

export function getScanCompliance(auth: AuthHeaders, scanId: string): Promise<ScanCompliance> {
  const frameworkId = import.meta.env.VITE_FRAMEWORK_ID || "cis_aws_v6";
  return request(auth, `/v1/compliance/frameworks/${frameworkId}/scans/${scanId}`);
}

export function getScanRiskSummary(auth: AuthHeaders, scanId: string): Promise<ScanRiskSummary> {
  return request(auth, `/v1/scans/${scanId}/risk-summary`);
}

export function getScanFixPriorities(
  auth: AuthHeaders,
  scanId: string,
  limit = 20,
): Promise<FixPriorityItem[]> {
  const capped = Math.min(Math.max(limit, 1), 100);
  return request(auth, `/v1/scans/${scanId}/fix-priorities`, { params: { limit: capped } });
}

export function getAssetRisk(
  auth: AuthHeaders,
  scanId: string,
  resourceId: string,
): Promise<ResourceRisk> {
  return request(auth, `/v1/assets/${encodeURIComponent(resourceId)}/risk`, {
    params: { scan_id: scanId },
  });
}

export function listFindings(
  auth: AuthHeaders,
  scanId: string,
  filters?: { result?: string; status?: string },
): Promise<Finding[]> {
  return request(auth, "/v1/findings", {
    params: { scan_id: scanId, ...filters, limit: 500 },
  });
}

export function getFinding(
  auth: AuthHeaders,
  scanId: string,
  findingId: string,
): Promise<FindingDetail> {
  return request(auth, `/v1/findings/${findingId}`, { params: { scan_id: scanId } });
}

export function listAssets(
  auth: AuthHeaders,
  scanId: string,
  opts?: { resource_type?: string; q?: string },
): Promise<Asset[]> {
  if (opts?.q) {
    return request(auth, "/v1/assets/search", {
      params: { scan_id: scanId, q: opts.q, type: opts.resource_type, limit: 500 },
    });
  }
  return request(auth, "/v1/assets", {
    params: { scan_id: scanId, resource_type: opts?.resource_type, limit: 500 },
  });
}

export type { ControlResult, FindingDetail, FixPriorityItem, ResourceRisk, ScanRiskSummary };
