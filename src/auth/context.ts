import * as React from 'react';

import { type SessionStatus } from '@/auth/sessionStatus';
import { type AuthUser } from '@/auth/types';
import { type AuthStrategy } from '@/config/env';

export type AuthContextValue = {
  authStrategy: AuthStrategy;
  accessToken: string | null;
  /** Derived from token + validated user; prefer this over isAuthenticated in route gates. */
  sessionStatus: SessionStatus;
  isAuthenticated: boolean;
  /** True while checking HttpOnly cookie session on load */
  isSessionLoading: boolean;
  /**
   * True after the first session bootstrap (/me) completes when a token exists,
   * or immediately when there is no token. Route gates should wait on this.
   */
  isAuthReady: boolean;
  /** True during a non-silent background profile refresh (does not block route gates). */
  isRefreshing: boolean;
  /**
   * @deprecated Use `!isAuthReady` for route gates. Kept for compatibility.
   */
  isUserLoading: boolean;
  user: AuthUser | null;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  refreshSession: (options?: { silent?: boolean }) => Promise<AuthUser | null>;
};

export const AuthContext = React.createContext<AuthContextValue | null>(null);
