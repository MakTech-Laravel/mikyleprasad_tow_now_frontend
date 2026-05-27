import type { AuthUser } from '@/auth/types';
import type { AuthStrategy } from '@/config/env';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * Single source of truth for route gates. Uses React token state (not storage reads)
 * so clears and /me validation stay in sync during reload.
 */
export function resolveSessionStatus(input: {
  authStrategy: AuthStrategy;
  isSessionLoading: boolean;
  isAuthReady: boolean;
  accessToken: string | null;
  user: AuthUser | null;
}): SessionStatus {
  const { authStrategy, isSessionLoading, isAuthReady, accessToken, user } = input;

  if (authStrategy === 'http_only_cookie') {
    if (isSessionLoading) return 'loading';
    return user ? 'authenticated' : 'unauthenticated';
  }

  if (!isAuthReady) return 'loading';

  if (!accessToken || !user) return 'unauthenticated';

  return 'authenticated';
}

export function isSessionAuthenticated(status: SessionStatus): boolean {
  return status === 'authenticated';
}
