import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { authCallbackUrl } from "./authRedirect";
import { config, isSupabaseAuth } from "./config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseAuth()) {
    throw new Error("Supabase client is only available when VITE_AUTH_MODE=supabase");
  }
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required");
  }
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "implicit",
      },
    });
  }
  return client;
}

/** Used in signUp emailRedirectTo — must match Supabase Auth → URL Configuration allowlist. */
export function supabaseEmailRedirectTo(): string {
  return authCallbackUrl();
}

/** Issuer claim for seed_identity_membership.py — must match JWT `iss`. */
export function supabaseAuthIssuer(): string {
  return `${config.supabaseUrl.replace(/\/$/, "")}/auth/v1`;
}
