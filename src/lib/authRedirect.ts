/** URL Supabase redirects to after email confirmation (must be allowlisted in Supabase). */
export function authCallbackUrl(): string {
  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.trim();
  const origin = configured ? configured.replace(/\/$/, "") : window.location.origin;
  return `${origin}/auth/callback`;
}

export function hasAuthHashInUrl(): boolean {
  return typeof window !== "undefined" && window.location.hash.includes("access_token");
}

export function clearAuthHashFromUrl(): void {
  if (typeof window === "undefined" || !window.location.hash) return;
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}
