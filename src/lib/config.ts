import { copy } from "./productCopy";

export type AuthMode = "dev_headers" | "supabase";

/** Customer-facing security assessment framework (P2). */
export const DEFAULT_FRAMEWORK_ID = "drantiq_security_assessment_v1";

export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8090",
  authMode: (import.meta.env.VITE_AUTH_MODE ?? "dev_headers") as AuthMode,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  /** Internal only — customer sees copy.defaultFrameworkDisplayTitle in UI. */
  frameworkId: import.meta.env.VITE_FRAMEWORK_ID ?? DEFAULT_FRAMEWORK_ID,
  productName: copy.productName,
  defaultTenantId: import.meta.env.VITE_TENANT_ID ?? "",
  defaultDevRole: import.meta.env.VITE_DEV_ROLE ?? "tenant_admin",
};

export function isSupabaseAuth(): boolean {
  return config.authMode === "supabase";
}
