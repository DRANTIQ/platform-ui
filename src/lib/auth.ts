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
