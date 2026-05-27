import type { NavigateFunction } from 'react-router-dom';

import {
  extractBearerTokenFromLoginBody,
  extractRefreshTokenFromLoginBody,
  extractUserFromAuthPayload,
} from '@/api/laravelResponse';
import { rolePolicy } from '@/auth/rolePolicy';
import { getUserRoles } from '@/auth/roles';
import { setRefreshToken } from '@/auth/token';
import type { AuthUser } from '@/auth/types';
import { clearCachedAuthUserIfDifferent } from '@/auth/userCache';
import { normalizeAuthUser } from '@/auth/normalizeAuthUser';
import { normalizeApprovalStatus } from '@/auth/normalizeApprovalStatus';

export const DRIVER_ONBOARDING_PATH = '/driver-onboarding';

export function isDriverAwaitingApproval(user: AuthUser | null): boolean {
  if (!user || user.role !== 'driver') {
    return false;
  }

  const status = normalizeApprovalStatus(user.approval_status);
  if (status === 'pending' || status === 'rejected') {
    return true;
  }

  // Drivers default to pending until explicitly approved in API payload.
  return status !== 'approved';
}

export function getPostAuthPath(user: AuthUser | null, from?: string): string {
  if (isDriverAwaitingApproval(user)) {
    return DRIVER_ONBOARDING_PATH;
  }

  if (from) {
    return from;
  }

  const roles = getUserRoles(user);
  for (const role of roles) {
    const dashboard = rolePolicy[role]?.dashboard;
    if (dashboard) {
      return dashboard;
    }
  }

  return '/dashboard';
}

export type PassportLoginPayload = {
  success?: boolean;
  message?: string;
  data?: {
    two_factor?: boolean;
    two_factor_token?: string;
    access_token?: string;
    token?: string;
    user?: AuthUser;
    [key: string]: unknown;
  };
};

export function isTwoFactorChallengeResponse(body: PassportLoginPayload): boolean {
  const data = body.data;
  return Boolean(data && typeof data === 'object' && data.two_factor === true && data.two_factor_token);
}

export function applyPassportTokens(
  body: PassportLoginPayload,
  setToken: (token: string) => void,
  setUser: (user: AuthUser | null) => void,
): AuthUser | null {
  const token = extractBearerTokenFromLoginBody(body);
  if (!token) {
    throw new Error('Login succeeded, but no access token was returned.');
  }

  const rawUser = extractUserFromAuthPayload(body);
  setToken(token);
  const refresh = extractRefreshTokenFromLoginBody(body);
  if (refresh) setRefreshToken(refresh);
  if (rawUser) {
    clearCachedAuthUserIfDifferent(rawUser);
    const user = normalizeAuthUser(rawUser);
    setUser(user);
    return user;
  }

  return null;
}

export function navigateAfterAuth(
  navigate: NavigateFunction,
  user: AuthUser | null,
  from?: string,
): void {
  navigate(getPostAuthPath(user, from), { replace: true });
}
