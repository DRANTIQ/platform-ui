import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useScanPolling } from "../../hooks/useScanPolling";
import {
  createScan,
  listIntegrations,
  updateOnboardingState,
} from "../../lib/api";
import { SCAN_PROGRESS_STEPS } from "../../lib/awsOnboarding";
import { isTerminalStatus } from "../../lib/format";

export function ScanProgressPage() {
  const { authHeaders, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [scanId, setScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scan } = useScanPolling(authHeaders, scanId ?? undefined, !!scanId);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const integrations = await listIntegrations(authHeaders);
        if (!integrations.length) {
          navigate("/welcome/connect-aws", { replace: true });
          return;
        }
        await updateOnboardingState(authHeaders, "FIRST_SCAN_STARTED");
        const row = await createScan(authHeaders, integrations[0].id);
        if (!cancelled) setScanId(row.id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to start scan");
      }
    }
    start();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, navigate]);

  useEffect(() => {
    if (!scanId) return;
    const timer = window.setInterval(() => {
      setActiveStep((s) => {
        if (scan && isTerminalStatus(scan.status)) return SCAN_PROGRESS_STEPS.length - 1;
        return Math.min(s + 1, SCAN_PROGRESS_STEPS.length - 2);
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [scanId, scan]);

  useEffect(() => {
    if (!scan || !isTerminalStatus(scan.status)) return;
    async function complete() {
      setActiveStep(SCAN_PROGRESS_STEPS.length - 1);
      await updateOnboardingState(authHeaders, "FIRST_SCAN_COMPLETE");
      await refreshMe();
      await new Promise((r) => setTimeout(r, 800));
      navigate("/welcome/results", { replace: true, state: { scanId: scan!.id } });
    }
    void complete();
  }, [scan, authHeaders, navigate, refreshMe]);

  const progress = Math.round(((activeStep + 1) / SCAN_PROGRESS_STEPS.length) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-indigo-600">Step 3 of 4 · Run scan</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Analyzing your AWS environment…</h1>
      <p className="mt-2 text-slate-600">This usually takes a few minutes. You can keep this tab open.</p>

      <ul className="mt-8 space-y-3">
        {SCAN_PROGRESS_STEPS.map((step, i) => {
          const done = i < activeStep;
          const current = i === activeStep;
          return (
            <li key={step.key} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  done
                    ? "bg-emerald-100 text-emerald-700"
                    : current
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? "✓" : current ? "…" : ""}
              </span>
              <span
                className={
                  done ? "text-slate-800" : current ? "font-medium text-slate-900" : "text-slate-400"
                }
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">{progress}%</p>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
    </div>
  );
}
