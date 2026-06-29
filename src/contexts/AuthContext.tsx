import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  acceptInvitation,
  ApiError,
  createWorkspace,
  getMe,
  type AuthHeaders,
} from "../lib/api";
import {
  canWrite,
  defaultTenantId,
  loadRole,
  loadTenantId,
  saveDevAuth,
  type DevRole,
} from "../lib/auth";
import { hasAuthHashInUrl } from "../lib/authRedirect";
import { isOnboardingComplete } from "../lib/onboarding";
import { isSupabaseAuth } from "../lib/config";
import { sleep } from "../lib/retry";
import { getSupabase, supabaseEmailRedirectTo, supabasePasswordResetRedirectTo } from "../lib/supabase";
import type { MeResponse } from "../types/platform";

type AuthContextValue = {
  mode: "dev_headers" | "supabase";
  loading: boolean;
  isAuthenticated: boolean;
  hasSession: boolean;
  needsWorkspace: boolean;
  onboardingComplete: boolean;
  onboardingState: string | null;
  workspaceName: string | null;
  email: string | null;
  tenantId: string;
  role: DevRole;
  canWrite: boolean;
  authHeaders: AuthHeaders;
  me: MeResponse | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirm: boolean }>;
  createWorkspace: (workspaceName: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshMe: () => Promise<MeResponse | null>;
  setDevAuth: (tenantId: string, role: DevRole) => void;
  authError: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isNotProvisionedError(msg: string | null): boolean {
  return !!msg?.toLowerCase().includes("provisioned") || !!msg?.toLowerCase().includes("workspace");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseMode = isSupabaseAuth();

  const [devTenantId, setDevTenantId] = useState(loadTenantId);
  const [devRole, setDevRole] = useState<DevRole>(loadRole);
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(supabaseMode);
  const [authError, setAuthError] = useState<string | null>(null);
  const meRefreshRef = useRef<Promise<MeResponse | null> | null>(null);

  const refreshMeWithToken = useCallback(async (token: string) => {
    if (meRefreshRef.current) {
      return meRefreshRef.current;
    }

    const task = (async () => {
      let lastError: unknown;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const profile = await getMe({ tenantId: "", role: "viewer", bearerToken: token });
          setMe(profile);
          setAuthError(null);
          return profile;
        } catch (e) {
          lastError = e;
          if (e instanceof ApiError && e.status === 403) {
            setMe(null);
            setAuthError(e.message);
            return null;
          }
          const msg = e instanceof Error ? e.message : "Failed to load profile";
          if (isNotProvisionedError(msg)) {
            setMe(null);
            setAuthError(msg);
            return null;
          }
          if (attempt < 3) {
            await sleep(250 * (attempt + 1));
          }
        }
      }
      const msg = lastError instanceof Error ? lastError.message : "Failed to load profile";
      setAuthError(msg);
      setMe(null);
      throw lastError instanceof Error ? lastError : new Error(msg);
    })();

    meRefreshRef.current = task;
    try {
      return await task;
    } finally {
      if (meRefreshRef.current === task) {
        meRefreshRef.current = null;
      }
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return null;
    return refreshMeWithToken(token);
  }, [session?.access_token, refreshMeWithToken]);

  useEffect(() => {
    if (!supabaseMode) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    let cancelled = false;

    async function waitForHashSession() {
      if (!hasAuthHashInUrl()) return;
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 5000);
        const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
          if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && sess?.access_token) {
            window.clearTimeout(timeout);
            listener.subscription.unsubscribe();
            resolve();
          }
        });
      });
    }

    async function init() {
      await waitForHashSession();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      if (data.session?.access_token) {
        try {
          await refreshMeWithToken(data.session.access_token);
        } catch {
          /* authError set in refreshMeWithToken */
        }
      }
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.access_token) {
        setMe(null);
        return;
      }
      if (event === "INITIAL_SESSION") {
        return;
      }
      void refreshMeWithToken(nextSession.access_token).catch(() => undefined);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabaseMode, refreshMeWithToken]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session?.access_token) throw new Error("No session returned");
    setSession(data.session);
    await refreshMeWithToken(data.session.access_token);
  }, [refreshMeWithToken]);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: supabaseEmailRedirectTo(),
      },
    });
    if (error) throw new Error(error.message);
    if (data.session) {
      setSession(data.session);
    }
    return { needsEmailConfirm: !data.session };
  }, []);

  const createWorkspaceForUser = useCallback(async (workspaceName: string) => {
    const token = session?.access_token;
    if (!token) throw new Error("Sign in required");
    await createWorkspace(token, workspaceName.trim());
    await refreshMeWithToken(token);
  }, [session?.access_token, refreshMeWithToken]);

  const acceptInvite = useCallback(async (token: string) => {
    const bearer = session?.access_token;
    if (!bearer) throw new Error("Sign in required");
    await acceptInvitation(bearer, token);
    await refreshMeWithToken(bearer);
  }, [session?.access_token, refreshMeWithToken]);

  const signOut = useCallback(async () => {
    if (supabaseMode) {
      await getSupabase().auth.signOut();
    }
    setSession(null);
    setMe(null);
    setAuthError(null);
  }, [supabaseMode]);

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: supabasePasswordResetRedirectTo(),
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }, []);

  const setDevAuth = useCallback((tenantId: string, role: DevRole) => {
    saveDevAuth(tenantId, role);
    setDevTenantId(tenantId);
    setDevRole(role);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    if (supabaseMode) {
      const token = session?.access_token;
      const role = (me?.role as DevRole) ?? "viewer";
      const onboardingState = me?.workspace?.onboarding_state ?? null;
      const needsWorkspace = !!token && !me && isNotProvisionedError(authError);
      return {
        mode: "supabase",
        loading,
        hasSession: !!token,
        needsWorkspace,
        isAuthenticated: !!token && !!me,
        onboardingComplete: isOnboardingComplete(onboardingState),
        onboardingState,
        workspaceName: me?.workspace?.name ?? null,
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
        session,
        signIn,
        signUp,
        createWorkspace: createWorkspaceForUser,
        acceptInvite,
        signOut,
        requestPasswordReset,
        updatePassword,
        refreshMe,
        setDevAuth,
        authError,
      };
    }

    return {
      mode: "dev_headers",
      loading: false,
      hasSession: !!devTenantId,
      needsWorkspace: false,
      isAuthenticated: !!devTenantId,
      onboardingComplete: true,
      onboardingState: "ONBOARDING_COMPLETE",
      workspaceName: null,
      email: null,
      tenantId: devTenantId || defaultTenantId(),
      role: devRole,
      canWrite: canWrite(devRole),
      authHeaders: {
        tenantId: devTenantId || defaultTenantId(),
        role: devRole,
      },
      me: null,
      session: null,
      signIn: async () => {
        throw new Error("Use dev headers or switch VITE_AUTH_MODE=supabase");
      },
      signUp: async () => {
        throw new Error("Use dev headers or switch VITE_AUTH_MODE=supabase");
      },
      createWorkspace: async () => {
        throw new Error("Use dev headers or switch VITE_AUTH_MODE=supabase");
      },
      acceptInvite: async () => {
        throw new Error("Use dev headers or switch VITE_AUTH_MODE=supabase");
      },
      signOut: async () => undefined,
      requestPasswordReset: async () => {
        throw new Error("Use dev headers or switch VITE_AUTH_MODE=supabase");
      },
      updatePassword: async () => {
        throw new Error("Use dev headers or switch VITE_AUTH_MODE=supabase");
      },
      refreshMe: async () => null,
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
    signUp,
    createWorkspaceForUser,
    acceptInvite,
    signOut,
    requestPasswordReset,
    updatePassword,
    refreshMe,
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
