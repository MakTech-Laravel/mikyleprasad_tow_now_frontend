import { type AuthUser } from '@/auth/types';

/**
 * Typical Laravel `sendResponse($success, $message, $payload)` JSON:
 * `{ success?: boolean, message?: string, data?: T }`
 */
export function unwrapLaravelData<T = unknown>(body: unknown): T | null {
  if (body === null || body === undefined) return null;
  if (typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  if ('data' in o && o.data !== undefined) {
    return o.data as T;
  }
  return body as T;
}

function unwrapLaravelDataDeep(body: unknown): unknown {
  let cur: unknown = body;
  for (let i = 0; i < 4; i++) {
    if (!cur || typeof cur !== 'object') return cur;
    const o = cur as Record<string, unknown>;
    if (!('data' in o)) return cur;
    cur = o.data;
  }
  return cur;
}

/** Passport / your login payload: `token` or `access_token` at root or under `data`. */
export function extractBearerTokenFromLoginBody(body: unknown): string | null {
  if (body === null || body === undefined) return null;
  if (typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;
  const direct =
    (typeof root.token === 'string' && root.token) ||
    (typeof root.access_token === 'string' && root.access_token) ||
    null;
  if (direct) return direct;
  const inner = root.data;
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>;
    return (
      (typeof d.token === 'string' && d.token) ||
      (typeof d.access_token === 'string' && d.access_token) ||
      null
    );
  }
  return null;
}

/** OAuth / Passport: `refresh_token` at root or under `data`. */
export function extractRefreshTokenFromLoginBody(body: unknown): string | null {
  if (body === null || body === undefined) return null;
  if (typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;
  const direct = (typeof root.refresh_token === 'string' && root.refresh_token) || null;
  if (direct) return direct;
  const inner = root.data;
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>;
    return (typeof d.refresh_token === 'string' && d.refresh_token) || null;
  }
  return null;
}

/** Map Laravel `UserResource` / user object from login or `/me`. */
export function extractUserFromAuthPayload(body: unknown): AuthUser | null {
  const data = unwrapLaravelDataDeep(body);
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;

  // Common: { data: { user: {...} } }
  if ('user' in o && o.user && typeof o.user === 'object') {
    const u = o.user as Record<string, unknown>;
    if ('id' in u || 'email' in u || 'phone' in u) return u as unknown as AuthUser;
  }

  // Sometimes: { data: {...user fields...} }
  if ('id' in o || 'email' in o || 'phone' in o) return o as unknown as AuthUser;
  return null;
}
