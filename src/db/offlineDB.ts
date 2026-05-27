import { createStore, del, entries, get, keys, set } from 'idb-keyval';

/**
 * idb-keyval's `createStore(dbName, storeName)` opens `indexedDB.open(dbName)` with no version bump.
 * Only the *first* store's `onupgradeneeded` runs; other `createStore` calls for the same `dbName`
 * never add their object stores → `NotFoundError` on transaction. Use one database per store.
 */
const bookingQueue = createStore('TowNowIDB_bookings_v1', 'entries');
const locationQueue = createStore('TowNowIDB_locations_v1', 'entries');
const dataCache = createStore('TowNowIDB_datacache_v1', 'entries');

export type BookingQueueEntry = Record<string, unknown> & {
  offline_temp_id: string;
  queued_at: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  retry_count: number;
};

export async function bookingQueueAdd(bookingData: Record<string, unknown>): Promise<string> {
  const offline_temp_id =
    typeof bookingData.offline_temp_id === 'string' && bookingData.offline_temp_id.length > 0
      ? bookingData.offline_temp_id
      : `offline_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const entry: BookingQueueEntry = {
    ...bookingData,
    offline_temp_id,
    queued_at: new Date().toISOString(),
    sync_status: 'pending',
    retry_count: 0,
  };

  await set(offline_temp_id, entry, bookingQueue);

  return offline_temp_id;
}

export async function bookingQueueGetAll(): Promise<BookingQueueEntry[]> {
  const vals = await entries<string, BookingQueueEntry>(bookingQueue);

  return vals.map(([, v]) => v);
}

export async function bookingQueueGetPending(): Promise<BookingQueueEntry[]> {
  const all = await bookingQueueGetAll();

  return all.filter((e) => e.sync_status === 'pending' || e.sync_status === 'failed');
}

export async function bookingQueueMarkSyncing(tempId: string): Promise<void> {
  const cur = await get<BookingQueueEntry>(tempId, bookingQueue);
  if (!cur) return;
  await set(tempId, { ...cur, sync_status: 'syncing' }, bookingQueue);
}

export async function bookingQueueMarkSynced(tempId: string): Promise<void> {
  await del(tempId, bookingQueue);
}

export async function bookingQueueMarkFailed(tempId: string, error: string): Promise<void> {
  const cur = await get<BookingQueueEntry>(tempId, bookingQueue);
  if (!cur) return;
  await set(
    tempId,
    {
      ...cur,
      sync_status: 'failed',
      retry_count: cur.retry_count + 1,
      last_error: error,
    },
    bookingQueue,
  );
}

export async function bookingQueueCount(): Promise<number> {
  const k = await keys(bookingQueue);

  return k.length;
}

export async function locationQueueAdd(
  lat: number,
  lng: number,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const id = `loc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await set(id, { lat, lng, ...extra, queued_at: new Date().toISOString() }, locationQueue);
}

export async function locationQueueGetAll(): Promise<Record<string, unknown>[]> {
  const vals = await entries<string, Record<string, unknown>>(locationQueue);

  return vals.map(([, v]) => v);
}

export async function locationQueueClear(): Promise<void> {
  const k = await keys(locationQueue);
  await Promise.all(k.map((id) => del(id, locationQueue)));
}

type CacheWrap<T> = { data: T; expires_at: number };

export async function dataCacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  await set(
    key,
    { data, expires_at: Date.now() + ttlSeconds * 1000 } satisfies CacheWrap<T>,
    dataCache,
  );
}

export async function dataCacheGet<T>(key: string): Promise<T | null> {
  const row = await get<CacheWrap<T>>(key, dataCache);
  if (!row) return null;
  if (Date.now() > row.expires_at) {
    await del(key, dataCache);

    return null;
  }

  return row.data;
}

export async function dataCacheInvalidate(key: string): Promise<void> {
  await del(key, dataCache);
}
