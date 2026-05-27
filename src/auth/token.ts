import { env, type BearerTokenPersistence } from '@/config/env';

const STORAGE_KEY_ACCESS = 'react-vite-laravel.bearer_token';
const STORAGE_KEY_REFRESH = 'react-vite-laravel.refresh_token';

/** In-RAM only — lost on full reload. */
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

function readAccess(mode: BearerTokenPersistence): string | null {
  if (typeof window === 'undefined') return null;
  if (mode === 'memory') return memoryAccessToken;
  try {
    if (mode === 'session') return sessionStorage.getItem(STORAGE_KEY_ACCESS);
    return localStorage.getItem(STORAGE_KEY_ACCESS);
  } catch {
    return null;
  }
}

function writeAccess(mode: BearerTokenPersistence, token: string) {
  if (typeof window === 'undefined') return;
  if (mode === 'memory') {
    memoryAccessToken = token;
    return;
  }
  try {
    if (mode === 'session') {
      sessionStorage.setItem(STORAGE_KEY_ACCESS, token);
      return;
    }
    localStorage.setItem(STORAGE_KEY_ACCESS, token);
  } catch {
    memoryAccessToken = token;
  }
}

function readRefresh(mode: BearerTokenPersistence): string | null {
  if (typeof window === 'undefined') return null;
  if (mode === 'memory') return memoryRefreshToken;
  try {
    if (mode === 'session') return sessionStorage.getItem(STORAGE_KEY_REFRESH);
    return localStorage.getItem(STORAGE_KEY_REFRESH);
  } catch {
    return null;
  }
}

function writeRefresh(mode: BearerTokenPersistence, token: string) {
  if (typeof window === 'undefined') return;
  if (mode === 'memory') {
    memoryRefreshToken = token;
    return;
  }
  try {
    if (mode === 'session') {
      sessionStorage.setItem(STORAGE_KEY_REFRESH, token);
      return;
    }
    localStorage.setItem(STORAGE_KEY_REFRESH, token);
  } catch {
    memoryRefreshToken = token;
  }
}

function clearAllAuthStorage() {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY_ACCESS);
    localStorage.removeItem(STORAGE_KEY_ACCESS);
    sessionStorage.removeItem(STORAGE_KEY_REFRESH);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
  } catch {
    // ignore
  }
}

/**
 * Passport / Sanctum access token returned in JSON (OTP, login, refresh).
 * Always persisted and readable regardless of `VITE_AUTH_STRATEGY`: the API
 * still expects `Authorization: Bearer` for `auth:api` routes even when the
 * app also uses HttpOnly cookies for other flows.
 */
export function getAccessToken(): string | null {
  return readAccess(env.bearerTokenPersistence);
}

export function setAccessToken(token: string) {
  writeAccess(env.bearerTokenPersistence, token);
}

/**
 * Refresh token — only used when `env.refreshTokenEnabled` and login/refresh responses include it.
 */
export function getRefreshToken(): string | null {
  if (!env.refreshTokenEnabled) {
    return null;
  }
  return readRefresh(env.bearerTokenPersistence);
}

export function setRefreshToken(token: string) {
  if (!env.refreshTokenEnabled) return;
  writeRefresh(env.bearerTokenPersistence, token);
}

/** Clears access + refresh tokens (logout / invalid session). */
export function clearAccessToken() {
  clearAllAuthStorage();
}
