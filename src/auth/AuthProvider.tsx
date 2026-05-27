import * as React from 'react';

import { api } from '@/api/client';
import { AuthContext, type AuthContextValue } from '@/auth/context';
import { isDriverAwaitingApproval } from '@/auth/completePassportLogin';
import {
  beginAuthBootstrap,
  endAuthBootstrap,
  markInitialSessionProbeComplete,
} from '@/auth/authBootstrap';
import { fetchCurrentUser } from '@/auth/session';
import { SESSION_INVALIDATED_EVENT } from '@/auth/sessionEvents';
import { clearGuestToken } from '@/auth/guestToken';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/auth/token';
import { type AuthUser } from '@/auth/types';
import { onDriverApprovalStatusPatch } from '@/auth/driverApprovalRedirect';
import { normalizeAuthUser } from '@/auth/normalizeAuthUser';
import {
  clearCachedAuthUser,
  clearCachedAuthUserIfDifferent,
  setCachedAuthUser,
} from '@/auth/userCache';
import { getRoleLogoutPath } from '@/auth/rolePolicy';
import { getUserRoles } from '@/auth/roles';
import { isSessionAuthenticated, resolveSessionStatus } from '@/auth/sessionStatus';
import { env } from '@/config/env';

function initialAuthReady(): boolean {
  if (env.authStrategy === 'http_only_cookie') return false;
  return !getAccessToken();
}

function clearLocalSessionState(
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>,
  setAccessTokenState: React.Dispatch<React.SetStateAction<string | null>>,
) {
  clearAccessToken();
  clearCachedAuthUser();
  setAccessTokenState(null);
  setUser(null);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessTokenState, setAccessTokenState] = React.useState<string | null>(() =>
    getAccessToken(),
  );
  // Profile is applied only after /me succeeds — never hydrate from cache on load.
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isSessionLoading, setIsSessionLoading] = React.useState(
    () => env.authStrategy === 'http_only_cookie',
  );
  const [isAuthReady, setIsAuthReady] = React.useState(initialAuthReady);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const sessionRefreshInFlightRef = React.useRef<Promise<AuthUser | null> | null>(null);
  const sessionEpochRef = React.useRef(0);
  const initialBootstrapDoneRef = React.useRef(false);

  const applyUserFromApi = React.useCallback((raw: AuthUser | null): AuthUser | null => {
    if (!raw) return null;
    const normalized = normalizeAuthUser(raw);
    setUser(normalized);
    setCachedAuthUser(normalized);
    if (env.isDev) {
      console.debug('[auth] session: /me returned user; snapshot updated');
    }
    return normalized;
  }, []);

  const invalidateLocalSession = React.useCallback(() => {
    sessionEpochRef.current += 1;
    sessionRefreshInFlightRef.current = null;
    endAuthBootstrap();
    clearLocalSessionState(setUser, setAccessTokenState);
    setIsAuthReady(true);
    markInitialSessionProbeComplete();
  }, []);

  React.useEffect(() => {
    const onInvalidated = () => invalidateLocalSession();
    window.addEventListener(SESSION_INVALIDATED_EVENT, onInvalidated);
    return () => window.removeEventListener(SESSION_INVALIDATED_EVENT, onInvalidated);
  }, [invalidateLocalSession]);

  const refreshSession = React.useCallback(
    async (options?: { silent?: boolean }): Promise<AuthUser | null> => {
      const silent = options?.silent === true;
      const token = getAccessToken();

      if (!token && env.authStrategy === 'bearer_memory') {
        setIsAuthReady(true);
        markInitialSessionProbeComplete();
        return null;
      }

      if (!silent) {
        setIsRefreshing(true);
      }

      if (!sessionRefreshInFlightRef.current) {
        const epochAtStart = sessionEpochRef.current;
        beginAuthBootstrap();
        sessionRefreshInFlightRef.current = (async () => {
          try {
            const u = await fetchCurrentUser();
            if (epochAtStart !== sessionEpochRef.current) {
              return null;
            }
            if (u) {
              return applyUserFromApi(u);
            }
            if (env.authStrategy === 'bearer_memory' && getAccessToken()) {
              if (env.isDev) {
                console.debug('[auth] session: /me invalid; clearing local session');
              }
              clearLocalSessionState(setUser, setAccessTokenState);
            } else {
              setUser(null);
            }
            return null;
          } finally {
            sessionRefreshInFlightRef.current = null;
          }
        })();
      }

      try {
        return await sessionRefreshInFlightRef.current;
      } finally {
        setIsAuthReady(true);
        endAuthBootstrap();
        markInitialSessionProbeComplete();
        if (!silent) {
          setIsRefreshing(false);
        }
      }
    },
    [applyUserFromApi],
  );

  React.useEffect(() => {
    if (env.authStrategy !== 'http_only_cookie') {
      setIsSessionLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const u = await fetchCurrentUser();
      if (!cancelled) {
        if (u) {
          applyUserFromApi(u);
        } else {
          setUser(null);
        }
        setIsSessionLoading(false);
        setIsAuthReady(true);
        markInitialSessionProbeComplete();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyUserFromApi]);

  React.useEffect(() => {
    if (env.authStrategy !== 'bearer_memory') return;
    if (initialBootstrapDoneRef.current) return;
    initialBootstrapDoneRef.current = true;

    if (!getAccessToken()) {
      setIsAuthReady(true);
      markInitialSessionProbeComplete();
      return;
    }

    setIsAuthReady(false);
    void refreshSession({ silent: true });
  }, [refreshSession]);

  React.useEffect(() => {
    return onDriverApprovalStatusPatch((approvalStatus) => {
      setUser((prev) => {
        if (!prev || prev.role !== 'driver') {
          return prev;
        }
        const next = { ...prev, approval_status: approvalStatus };
        setCachedAuthUser(next);
        return next;
      });
    });
  }, []);

  React.useEffect(() => {
    if (env.authStrategy !== 'bearer_memory') return;
    if (accessTokenState) return;
    clearCachedAuthUser();
    setUser(null);
    setIsAuthReady(true);
    markInitialSessionProbeComplete();
  }, [accessTokenState]);

  const sessionStatus = resolveSessionStatus({
    authStrategy: env.authStrategy,
    isSessionLoading,
    isAuthReady,
    accessToken: accessTokenState,
    user,
  });

  React.useEffect(() => {
    if (sessionStatus !== 'authenticated' || !user) return;
    if (isDriverAwaitingApproval(user)) return;

    let cancelled = false;
    void import('@/services/fcm.service').then(({ initFCM }) => {
      if (!cancelled) void initFCM();
    });
    return () => {
      cancelled = true;
    };
  }, [sessionStatus, user]);

  const setToken = React.useCallback((token: string) => {
    clearGuestToken();
    sessionEpochRef.current += 1;
    setAccessToken(token);
    setAccessTokenState(token);
    setIsAuthReady(false);
    sessionRefreshInFlightRef.current = null;
  }, []);

  const setUserWithCache = React.useCallback((nextUser: AuthUser | null) => {
    if (nextUser) {
      clearCachedAuthUserIfDifferent(nextUser);
    }
    const normalized = nextUser ? normalizeAuthUser(nextUser) : null;
    setUser(normalized);
    if (env.authStrategy !== 'bearer_memory') return;
    if (normalized) {
      setCachedAuthUser(normalized);
    } else {
      clearCachedAuthUser();
    }
  }, []);

  const logout = React.useCallback(async () => {
    clearAccessToken();
    clearCachedAuthUser();
    setAccessTokenState(null);
    setUserWithCache(null);
    sessionRefreshInFlightRef.current = null;
    setIsAuthReady(true);
    markInitialSessionProbeComplete();
    try {
      if (env.logoutMode === 'multi') {
        const roles = getUserRoles(user);
        const roleLogout = roles.map((r) => getRoleLogoutPath(r)).find(Boolean);
        await api.post(roleLogout ?? env.authLogoutPath);
      } else {
        await api.post(env.authLogoutPath);
      }
    } catch {
      // Session may already be invalid; still clear client state
    }
  }, [setUserWithCache, user]);

  const isUserLoading = !isAuthReady;
  const isAuthenticated = isSessionAuthenticated(sessionStatus);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      authStrategy: env.authStrategy,
      accessToken: accessTokenState,
      sessionStatus,
      isAuthenticated,
      isSessionLoading,
      isAuthReady,
      isRefreshing,
      isUserLoading,
      user,
      setToken,
      logout,
      setUser: setUserWithCache,
      refreshSession,
    }),
    [
      accessTokenState,
      sessionStatus,
      isAuthenticated,
      isAuthReady,
      isRefreshing,
      isSessionLoading,
      isUserLoading,
      logout,
      refreshSession,
      setToken,
      setUserWithCache,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
