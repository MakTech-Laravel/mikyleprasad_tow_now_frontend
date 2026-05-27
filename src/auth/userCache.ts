import { env } from '@/config/env';
import { type AuthUser } from '@/auth/types';

const STORAGE_KEY_USER = 'react-vite-laravel.auth_user';

let memoryUser: AuthUser | null = null;

function readRaw(): string | null {
  if (typeof window === 'undefined') return null;
  if (env.bearerTokenPersistence === 'memory') return null;
  try {
    if (env.bearerTokenPersistence === 'session') return sessionStorage.getItem(STORAGE_KEY_USER);
    return localStorage.getItem(STORAGE_KEY_USER);
  } catch {
    return null;
  }
}

export function getCachedAuthUser(): AuthUser | null {
  if (env.authStrategy === 'http_only_cookie') return null;
  if (env.bearerTokenPersistence === 'memory') return memoryUser;

  const raw = readRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Drop cached profile when logging in as a different user (avoids stale approval_status). */
export function clearCachedAuthUserIfDifferent(incoming: AuthUser): void {
  const cached = getCachedAuthUser();
  if (cached && cached.id !== incoming.id) {
    clearCachedAuthUser();
  }
}

export function setCachedAuthUser(user: AuthUser): void {
  if (env.authStrategy === 'http_only_cookie') return;
  if (env.bearerTokenPersistence === 'memory') {
    memoryUser = user;
    return;
  }
  if (typeof window === 'undefined') return;

  try {
    const raw = JSON.stringify(user);
    if (env.bearerTokenPersistence === 'session') {
      sessionStorage.setItem(STORAGE_KEY_USER, raw);
      return;
    }
    localStorage.setItem(STORAGE_KEY_USER, raw);
  } catch {
    memoryUser = user;
  }
}

export function clearCachedAuthUser(): void {
  memoryUser = null;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch {
    // ignore
  }
}
