export type AuthMode = "dev_headers" | "supabase";

export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8090",
  authMode: (import.meta.env.VITE_AUTH_MODE ?? "dev_headers") as AuthMode,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  frameworkId: import.meta.env.VITE_FRAMEWORK_ID ?? "cis_aws_v6",
  defaultTenantId: import.meta.env.VITE_TENANT_ID ?? "",
  defaultDevRole: import.meta.env.VITE_DEV_ROLE ?? "tenant_admin",
};

export function isSupabaseAuth(): boolean {
  return config.authMode === "supabase";
}
