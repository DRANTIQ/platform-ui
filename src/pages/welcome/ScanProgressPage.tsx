import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useScanPolling } from "../../hooks/useScanPolling";
import {
  createScan,
  listIntegrations,
  updateOnboardingState,
} from "../../lib/api";
import { isTerminalStatus } from "../../lib/format";

const PROGRESS_MESSAGES = [
  "Discovering resources across your AWS account…",
  "Building your asset inventory…",
  "Evaluating 35 security policies…",
  "Mapping findings to CIS controls…",
];

export function ScanProgressPage() {
  const { authHeaders, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [scanId, setScanId] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

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
        if (!cancelled) {
          setScanId(row.id);
          setStarting(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to start scan");
          setStarting(false);
        }
      }
    }
    start();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % PROGRESS_MESSAGES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!scan || !isTerminalStatus(scan.status)) return;
    async function complete() {
      await updateOnboardingState(authHeaders, "FIRST_SCAN_COMPLETE");
      await refreshMe();
      navigate("/welcome/results", { replace: true, state: { scanId: scan!.id } });
    }
    void complete();
  }, [scan, authHeaders, navigate, refreshMe]);

  const progress =
    scan?.status === "completed" || scan?.status === "completed_with_errors"
      ? 100
      : scan?.status === "running"
        ? 65
        : starting
          ? 15
          : 35;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
      <h1 className="text-2xl font-bold text-slate-900">Running your first scan…</h1>
      <p className="mt-3 text-slate-600">{PROGRESS_MESSAGES[messageIndex]}</p>
      <div className="mx-auto mt-8 max-w-md">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-500">{progress}%</p>
      </div>
      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
    </div>
  );
}
