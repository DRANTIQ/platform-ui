import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { roleLabel, userInitials, type DevRole } from "../../lib/auth";
import { isSupabaseAuth } from "../../lib/config";

export function UserMenu() {
  const { email, role, workspaceName, signOut, mode } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (mode !== "supabase" || !isSupabaseAuth()) {
    return null;
  }

  const initials = userInitials(email, workspaceName);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 text-left shadow-sm transition hover:bg-slate-50"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white"
          aria-hidden
        >
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-700 sm:inline">
          {workspaceName ?? email?.split("@")[0] ?? "Account"}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-slate-900">{email}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {roleLabel(role as DevRole)}
              {workspaceName ? ` · ${workspaceName}` : ""}
            </p>
          </div>
          <div className="py-1">
            <Link
              to="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Account settings
            </Link>
            <a
              href="https://drantiq.ai"
              role="menuitem"
              target="_blank"
              rel="noreferrer"
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Help & documentation
            </a>
          </div>
          <div className="border-t border-slate-100 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
