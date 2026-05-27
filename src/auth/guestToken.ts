import { getAccessToken } from '@/auth/token';
import { env, type BearerTokenPersistence } from '@/config/env';

const STORAGE_KEY_GUEST = 'react-vite-laravel.guest_token';
const STORAGE_KEY_GUEST_EXPIRES = 'react-vite-laravel.guest_token_expires_at';

let memoryGuestToken: string | null = null;
let memoryGuestTokenExpiresAt: number | null = null;

function guestStorageMode(): BearerTokenPersistence {
  if (env.authStrategy === 'bearer_memory') return env.bearerTokenPersistence;
  return 'session';
}

function readStored(mode: BearerTokenPersistence): { token: string | null; expiresAt: number | null } {
  if (typeof window === 'undefined') return { token: null, expiresAt: null };
  if (mode === 'memory') {
    return { token: memoryGuestToken, expiresAt: memoryGuestTokenExpiresAt };
  }

  try {
    const storage = mode === 'local' ? localStorage : sessionStorage;
    const token = storage.getItem(STORAGE_KEY_GUEST);
    const expiresRaw = storage.getItem(STORAGE_KEY_GUEST_EXPIRES);
    const expiresAt = expiresRaw ? Number(expiresRaw) : null;
    return {
      token,
      expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
    };
  } catch {
    return { token: memoryGuestToken, expiresAt: memoryGuestTokenExpiresAt };
  }
}

function writeStored(mode: BearerTokenPersistence, token: string, expiresAt: number) {
  memoryGuestToken = token;
  memoryGuestTokenExpiresAt = expiresAt;

  if (typeof window === 'undefined' || mode === 'memory') return;

  try {
    const storage = mode === 'local' ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY_GUEST, token);
    storage.setItem(STORAGE_KEY_GUEST_EXPIRES, String(expiresAt));
  } catch {
    // Memory fallback is already populated.
  }
}

function removeStored() {
  memoryGuestToken = null;
  memoryGuestTokenExpiresAt = null;
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(STORAGE_KEY_GUEST);
    sessionStorage.removeItem(STORAGE_KEY_GUEST_EXPIRES);
    localStorage.removeItem(STORAGE_KEY_GUEST);
    localStorage.removeItem(STORAGE_KEY_GUEST_EXPIRES);
  } catch {
    // ignore
  }
}

function createGuestToken() {
  const uuid = window.crypto.randomUUID?.();
  if (uuid) return `guest_${uuid}`;

  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `guest_${Date.now().toString(36)}_${token}`;
}

function nextExpiry() {
  return Date.now() + env.guestTokenLifetimeDays * 24 * 60 * 60 * 1000;
}

export function clearGuestToken() {
  removeStored();
}

export function getGuestToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (getAccessToken()) return null;

  const mode = guestStorageMode();
  const current = readStored(mode);
  if (current.token && current.expiresAt && current.expiresAt > Date.now()) {
    return current.token;
  }

  removeStored();
  const token = createGuestToken();
  writeStored(mode, token, nextExpiry());
  return token;
}
