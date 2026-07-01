import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { listIntegrations } from "../lib/api";
import {
  integrationMatchesFilter,
  isSpecificIntegrationFilter,
  SCAN_FILTER_ALL,
  SCAN_FILTER_AWS,
  SCAN_FILTER_AZURE,
} from "../lib/integrationDisplay";
import type { Integration } from "../types/platform";

const SCOPE_STORAGE_KEY = "platform-ui:environment-scope";

type EnvironmentScopeContextValue = {
  scope: string;
  setScope: (scope: string) => void;
  integrations: Integration[];
  integrationsById: Map<string, Integration>;
  filteredIntegrations: Integration[];
  loading: boolean;
  refreshIntegrations: () => Promise<void>;
  hasAws: boolean;
  hasAzure: boolean;
  isSingleAccount: boolean;
};

const EnvironmentScopeContext = createContext<EnvironmentScopeContextValue | null>(null);

export function EnvironmentScopeProvider({ children }: { children: ReactNode }) {
  const { authHeaders } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [scope, setScopeState] = useState(SCAN_FILTER_ALL);
  const [loading, setLoading] = useState(true);

  const refreshIntegrations = useCallback(async () => {
    const rows = await listIntegrations(authHeaders);
    setIntegrations(rows);
    setScopeState((current) => {
      if (current === SCAN_FILTER_ALL) return current;
      if (current === SCAN_FILTER_AWS && rows.some((row) => row.provider === "aws")) return current;
      if (current === SCAN_FILTER_AZURE && rows.some((row) => row.provider === "azure")) {
        return current;
      }
      if (rows.some((row) => row.id === current)) return current;
      const stored = localStorage.getItem(SCOPE_STORAGE_KEY);
      if (stored === SCAN_FILTER_ALL) return stored;
      if (stored === SCAN_FILTER_AWS && rows.some((row) => row.provider === "aws")) return stored;
      if (stored === SCAN_FILTER_AZURE && rows.some((row) => row.provider === "azure")) {
        return stored;
      }
      if (stored && rows.some((row) => row.id === stored)) return stored;
      return SCAN_FILTER_ALL;
    });
  }, [authHeaders]);

  useEffect(() => {
    refreshIntegrations()
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false));
  }, [refreshIntegrations]);

  const setScope = useCallback((next: string) => {
    setScopeState(next);
    localStorage.setItem(SCOPE_STORAGE_KEY, next);
  }, []);

  const integrationsById = useMemo(
    () => new Map(integrations.map((row) => [row.id, row])),
    [integrations],
  );

  const filteredIntegrations = useMemo(
    () => integrations.filter((row) => integrationMatchesFilter(row, scope)),
    [integrations, scope],
  );

  const hasAws = integrations.some((row) => row.provider === "aws");
  const hasAzure = integrations.some((row) => row.provider === "azure");

  const value = useMemo(
    () => ({
      scope,
      setScope,
      integrations,
      integrationsById,
      filteredIntegrations,
      loading,
      refreshIntegrations,
      hasAws,
      hasAzure,
      isSingleAccount: isSpecificIntegrationFilter(scope),
    }),
    [
      scope,
      setScope,
      integrations,
      integrationsById,
      filteredIntegrations,
      loading,
      refreshIntegrations,
      hasAws,
      hasAzure,
    ],
  );

  return (
    <EnvironmentScopeContext.Provider value={value}>{children}</EnvironmentScopeContext.Provider>
  );
}

export function useEnvironmentScope() {
  const ctx = useContext(EnvironmentScopeContext);
  if (!ctx) {
    throw new Error("useEnvironmentScope must be used within EnvironmentScopeProvider");
  }
  return ctx;
}
