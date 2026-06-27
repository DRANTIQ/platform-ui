import type {
  Asset,
  ControlResult,
  Finding,
  Integration,
  MeResponse,
  Scan,
  ScanCompliance,
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

async function request<T>(
  auth: AuthHeaders,
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  },
): Promise<T> {
  const base = import.meta.env.VITE_API_URL.replace(/\/$/, "");
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
  const base = import.meta.env.VITE_API_URL.replace(/\/$/, "");
  return fetch(`${base}/health`).then((r) => r.json());
}

export function getMe(auth: AuthHeaders): Promise<MeResponse> {
  return request(auth, "/v1/me");
}

export function listIntegrations(auth: AuthHeaders): Promise<Integration[]> {
  return request(auth, "/v1/integrations");
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

export function listFindings(
  auth: AuthHeaders,
  scanId: string,
  filters?: { result?: string; status?: string },
): Promise<Finding[]> {
  return request(auth, "/v1/findings", {
    params: { scan_id: scanId, ...filters, limit: 500 },
  });
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

export type { ControlResult };
