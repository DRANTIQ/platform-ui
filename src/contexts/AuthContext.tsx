import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getMe, type AuthHeaders } from "../lib/api";
import {
  canWrite,
  defaultTenantId,
  loadRole,
  loadTenantId,
  saveDevAuth,
  type DevRole,
} from "../lib/auth";
import { isSupabaseAuth } from "../lib/config";
import { getSupabase } from "../lib/supabase";
import type { MeResponse } from "../types/platform";

type AuthContextValue = {
  mode: "dev_headers" | "supabase";
  loading: boolean;
  isAuthenticated: boolean;
  email: string | null;
  tenantId: string;
  role: DevRole;
  canWrite: boolean;
  authHeaders: AuthHeaders;
  me: MeResponse | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setDevAuth: (tenantId: string, role: DevRole) => void;
  authError: string | null;
  needsProvisioning: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseMode = isSupabaseAuth();

  const [devTenantId, setDevTenantId] = useState(loadTenantId);
  const [devRole, setDevRole] = useState<DevRole>(loadRole);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(supabaseMode);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshMe = useCallback(async (token: string) => {
    const profile = await getMe({ tenantId: "", role: "viewer", bearerToken: token });
    setMe(profile);
    setAuthError(null);
    return profile;
  }, []);

  useEffect(() => {
    if (!supabaseMode) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    let cancelled = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      if (data.session?.access_token) {
        try {
          await refreshMe(data.session.access_token);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Failed to load profile";
          setAuthError(msg);
          setMe(null);
        }
      }
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.access_token) {
        try {
          await refreshMe(nextSession.access_token);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Failed to load profile";
          setAuthError(msg);
          setMe(null);
        }
      } else {
        setMe(null);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabaseMode, refreshMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session?.access_token) throw new Error("No session returned");
    setSession(data.session);
    await refreshMe(data.session.access_token);
  }, [refreshMe]);

  const signOut = useCallback(async () => {
    if (supabaseMode) {
      await getSupabase().auth.signOut();
    }
    setSession(null);
    setMe(null);
    setAuthError(null);
  }, [supabaseMode]);

  const setDevAuth = useCallback((tenantId: string, role: DevRole) => {
    saveDevAuth(tenantId, role);
    setDevTenantId(tenantId);
    setDevRole(role);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    if (supabaseMode) {
      const token = session?.access_token;
      const role = (me?.role as DevRole) ?? "viewer";
      const needsProvisioning =
        !!token && !me && !!authError?.toLowerCase().includes("provisioned");
      return {
        mode: "supabase",
        loading,
        isAuthenticated: !!token && !!me,
        needsProvisioning,
        email: me?.email ?? session?.user.email ?? null,
        tenantId: me?.tenant_id ?? "",
        role,
        canWrite: canWrite(role),
        authHeaders: {
          tenantId: me?.tenant_id ?? "",
          role,
          bearerToken: token,
        },
        me,
        signIn,
        signOut,
        setDevAuth,
        authError,
      };
    }

    return {
      mode: "dev_headers",
      loading: false,
      isAuthenticated: !!devTenantId,
      needsProvisioning: false,
      email: null,
      tenantId: devTenantId || defaultTenantId(),
      role: devRole,
      canWrite: canWrite(devRole),
      authHeaders: {
        tenantId: devTenantId || defaultTenantId(),
        role: devRole,
      },
      me: null,
      signIn: async () => {
        throw new Error("Use dev headers or switch VITE_AUTH_MODE=supabase");
      },
      signOut: async () => undefined,
      setDevAuth,
      authError: null,
    };
  }, [
    supabaseMode,
    loading,
    session,
    me,
    devTenantId,
    devRole,
    signIn,
    signOut,
    setDevAuth,
    authError,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
