import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const STEPS = [
  { path: "/welcome", label: "Welcome" },
  { path: "/welcome/connect", label: "Connect cloud" },
  { path: "/welcome/scan", label: "Run scan" },
  { path: "/welcome/results", label: "Review results" },
] as const;

function stepIndex(pathname: string): number {
  if (pathname.startsWith("/welcome/results")) return 3;
  if (pathname.startsWith("/welcome/scan")) return 2;
  if (pathname.startsWith("/welcome/connect-aws") || pathname.startsWith("/welcome/connect-azure")) {
    return 1;
  }
  return 0;
}

export function WelcomeLayout() {
  const { workspaceName } = useAuth();
  const location = useLocation();
  const current = stepIndex(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <span className="font-semibold text-slate-900">Drantiq</span>
          {workspaceName && <span className="text-sm text-slate-500">{workspaceName}</span>}
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav aria-label="Onboarding progress" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-xs sm:gap-0 sm:text-sm">
            {STEPS.map((step, i) => (
              <li key={step.path} className="flex items-center">
                <span
                  className={`flex items-center gap-2 rounded-full px-2 py-1 sm:px-3 ${
                    i === current
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : i < current
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      i <= current ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
                {i < STEPS.length - 1 && (
                  <span className="mx-1 hidden h-px w-6 bg-slate-200 sm:inline-block" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
