import { del, get, set } from 'idb-keyval';

type CacheEnvelope<T> = {
  expiresAt: number;
  value: T;
};

const PREFIX = 'towtrack:netcache:';

function keyOf(key: string): string {
  return `${PREFIX}${key}`;
}

export async function setNetworkCache<T>(key: string, value: T, ttlMs: number): Promise<void> {
  try {
    const payload: CacheEnvelope<T> = {
      expiresAt: Date.now() + ttlMs,
      value,
    };
    await set(keyOf(key), payload);
  } catch {
    // best-effort cache only
  }
}

export async function getNetworkCache<T>(key: string): Promise<T | null> {
  try {
    const parsed = (await get<CacheEnvelope<T>>(keyOf(key))) ?? null;
    if (!parsed) return null;
    if (typeof parsed?.expiresAt !== 'number') return null;
    if (Date.now() > parsed.expiresAt) {
      await del(keyOf(key));
      return null;
    }
    return parsed.value ?? null;
  } catch {
    return null;
  }
}
