import { Link, NavLink, Outlet } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { useAuth } from "../../contexts/AuthContext";
import { isSupabaseAuth } from "../../lib/config";
import { copy } from "../../lib/productCopy";

export function AppShell() {
  const { mode } = useAuth();
  const navCls = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-800"}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
              Drantiq
            </Link>
            <nav className="flex gap-5">
              <NavLink to="/" end className={navCls}>
                Security
              </NavLink>
              <NavLink to="/scans" className={navCls}>
                {copy.scansNav}
              </NavLink>
              <NavLink to="/integrations" className={navCls}>
                Integrations
              </NavLink>
              <NavLink to="/team" className={navCls}>
                Team
              </NavLink>
              {mode === "dev_headers" && (
                <NavLink to="/dev" className={navCls}>
                  Dev auth
                </NavLink>
              )}
            </nav>
          </div>
          {isSupabaseAuth() && mode === "supabase" ? <UserMenu /> : null}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-center text-xs leading-relaxed text-slate-500">{copy.disclaimer}</p>
        </div>
      </footer>
    </div>
  );
}
