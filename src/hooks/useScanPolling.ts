import { useEffect, useRef, useState } from "react";
import { getScan } from "../lib/api";
import { isTerminalStatus } from "../lib/format";
import type { Scan } from "../types/platform";
import type { AuthHeaders } from "../lib/api";

export function useScanPolling(
  auth: AuthHeaders,
  scanId: string | undefined,
  enabled = true,
  intervalMs = 2000,
): { scan: Scan | null; error: string | null; loading: boolean } {
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!scanId || !enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const row = await getScan(auth, scanId!);
        if (cancelled) return;
        setScan(row);
        setError(null);
        setLoading(false);
        if (!isTerminalStatus(row.status)) {
          timer.current = window.setTimeout(poll, intervalMs);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load scan");
        setLoading(false);
      }
    }

    setLoading(true);
    poll();

    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [auth.tenantId, auth.role, auth.bearerToken, scanId, enabled, intervalMs]);

  return { scan, error, loading };
}
