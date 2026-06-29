export type DevRole = "tenant_admin" | "viewer" | "super_admin";

const STORAGE_TENANT = "platform_ui_tenant_id";
const STORAGE_ROLE = "platform_ui_role";

export function defaultTenantId(): string {
  return import.meta.env.VITE_TENANT_ID || "";
}

export function defaultRole(): DevRole {
  const r = import.meta.env.VITE_DEV_ROLE || "tenant_admin";
  if (r === "viewer" || r === "super_admin") return r;
  return "tenant_admin";
}

export function loadTenantId(): string {
  return localStorage.getItem(STORAGE_TENANT) || defaultTenantId();
}

export function loadRole(): DevRole {
  const stored = localStorage.getItem(STORAGE_ROLE) as DevRole | null;
  return stored || defaultRole();
}

export function saveDevAuth(tenantId: string, role: DevRole): void {
  localStorage.setItem(STORAGE_TENANT, tenantId);
  localStorage.setItem(STORAGE_ROLE, role);
}

export function canWrite(role: DevRole): boolean {
  return role === "tenant_admin" || role === "super_admin";
}

export function roleLabel(role: DevRole): string {
  switch (role) {
    case "tenant_admin":
      return "Admin";
    case "viewer":
      return "Viewer";
    case "super_admin":
      return "Super Admin";
  }
}

/** Two-letter avatar initials from email or display name. */
export function userInitials(email: string | null, workspaceName?: string | null): string {
  if (workspaceName?.trim()) {
    const parts = workspaceName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return workspaceName.slice(0, 2).toUpperCase();
  }
  if (email) {
    const local = email.split("@")[0] ?? "";
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return local.slice(0, 2).toUpperCase() || "?";
  }
  return "?";
}
