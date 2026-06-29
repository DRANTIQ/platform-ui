import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const STEPS = [
  { path: "/welcome", label: "Welcome" },
  { path: "/welcome/connect-aws", label: "Connect AWS" },
  { path: "/welcome/scan", label: "First scan" },
  { path: "/welcome/results", label: "Results" },
];

function stepIndex(pathname: string): number {
  if (pathname.startsWith("/welcome/results")) return 3;
  if (pathname.startsWith("/welcome/scan")) return 2;
  if (pathname.startsWith("/welcome/connect-aws")) return 1;
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
          {workspaceName && (
            <span className="text-sm text-slate-500">{workspaceName}</span>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.path} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${i <= current ? "bg-indigo-600" : "bg-slate-300"}`}
              />
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 ${i < current ? "bg-indigo-600" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
