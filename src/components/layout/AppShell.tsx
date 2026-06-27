import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { isSupabaseAuth } from "../../lib/config";
import { roleLabel } from "../../lib/auth";

export function AppShell() {
  const { tenantId, role, email, signOut, mode } = useAuth();
  const navigate = useNavigate();
  const navCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`;

  async function handleLogout() {
    await signOut();
    if (isSupabaseAuth()) {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
              Platform
            </Link>
            <nav className="flex gap-5">
              <NavLink to="/" end className={navCls}>
                Dashboard
              </NavLink>
              <NavLink to="/scans" className={navCls}>
                Scans
              </NavLink>
              <NavLink to="/integrations" className={navCls}>
                Integrations
              </NavLink>
              {mode === "supabase" ? (
                <NavLink to="/dev" className={navCls}>
                  Session
                </NavLink>
              ) : (
                <NavLink to="/dev" className={navCls}>
                  Dev auth
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
              {roleLabel(role)}
            </span>
            {email && <span className="hidden sm:inline">{email}</span>}
            {!email && tenantId && (
              <span className="hidden font-mono sm:inline" title={tenantId}>
                {tenantId.slice(0, 8)}…
              </span>
            )}
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
              {mode === "supabase" ? "supabase" : "dev headers"}
            </span>
            {mode === "supabase" && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
