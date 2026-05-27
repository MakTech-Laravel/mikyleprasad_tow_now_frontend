import { isAuthBootstrapping, hasInitialSessionProbeCompleted } from '@/auth/authBootstrap';
import { clearAccessToken } from '@/auth/token';
import { clearCachedAuthUser } from '@/auth/userCache';

export const SESSION_INVALIDATED_EVENT = 'towtrack:session-invalidated';

export const GUEST_AUTH_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
  '/register-verify-otp',
  '/two-factor-challenge',
  '/register',
  '/select-operator',
] as const;

export function isGuestAuthPath(pathname: string): boolean {
  return GUEST_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Clears bearer tokens and cached profile snapshot (does not touch React state). */
export function clearClientSession(): void {
  clearAccessToken();
  clearCachedAuthUser();
}

export function emitSessionInvalidated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_INVALIDATED_EVENT));
}

let sessionClearInFlight = false;

/**
 * Clears client session after a confirmed 401. Does not navigate — RoleGate /
 * ProtectedRoute react to sessionStatus and perform a single SPA redirect.
 */
export function emitAuthRequired(_nextPath: string): void {
  if (typeof window === 'undefined') return;
  if (sessionClearInFlight) return;
  if (isAuthBootstrapping()) return;
  if (!hasInitialSessionProbeCompleted()) return;
  if (isGuestAuthPath(window.location.pathname)) return;

  sessionClearInFlight = true;
  clearClientSession();
  emitSessionInvalidated();

  window.setTimeout(() => {
    sessionClearInFlight = false;
  }, 2000);
}
