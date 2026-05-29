import {
  offlineSyncRides,
  updateDriverLocation,
  type OfflineRideSyncRow,
} from '@/api/rides';
import {
  bookingQueueGetPending,
  bookingQueueMarkFailed,
  bookingQueueMarkSynced,
  bookingQueueMarkSyncing,
  locationQueueClear,
  locationQueueGetAll,
} from '@/db/offlineDB';

let syncing = false;
const syncListeners = new Set<(s: { syncing: boolean; pending: number; done: number }) => void>();

export function onSyncStatusChange(
  cb: (s: { syncing: boolean; pending: number; done: number }) => void,
): () => void {
  syncListeners.add(cb);

  return () => syncListeners.delete(cb);
}

function notify(state: { syncing: boolean; pending: number; done: number }): void {
  syncListeners.forEach((cb) => cb(state));
}

export async function syncBookings(): Promise<void> {
  if (syncing) return;
  syncing = true;
  notify({ syncing: true, pending: 0, done: 0 });

  const pending = await bookingQueueGetPending();
  let done = 0;
  notify({ syncing: true, pending: pending.length, done: 0 });

  for (const row of pending) {
    const tempId = row.offline_temp_id;
    await bookingQueueMarkSyncing(tempId);

    const payload: OfflineRideSyncRow = {
      driver_id: Number(row.driver_id),
      pickup_location: String(row.pickup_location ?? ''),
      dropoff_location: String(row.dropoff_location ?? ''),
      notes: row.notes != null ? String(row.notes) : undefined,
      pickup_lat: row.pickup_lat != null ? Number(row.pickup_lat) : undefined,
      pickup_lng: row.pickup_lng != null ? Number(row.pickup_lng) : undefined,
      dropoff_lat: row.dropoff_lat != null ? Number(row.dropoff_lat) : undefined,
      dropoff_lng: row.dropoff_lng != null ? Number(row.dropoff_lng) : undefined,
      offline_temp_id: tempId,
      problem_type: row.problem_type != null ? String(row.problem_type) : undefined,
      problem_description: row.problem_description != null ? String(row.problem_description) : undefined,
      estimated_price: row.estimated_price != null ? Number(row.estimated_price) : undefined,
      payment_status: row.payment_status != null ? String(row.payment_status) : undefined,
    };

    try {
      const result = await offlineSyncRides([payload]);
      const first = result.results[0];
      if (first?.success) {
        await bookingQueueMarkSynced(tempId);
        done += 1;
      } else {
        await bookingQueueMarkFailed(tempId, first?.error ?? 'Sync failed');
      }
    } catch (e) {
      await bookingQueueMarkFailed(tempId, e instanceof Error ? e.message : 'Sync failed');
    }

    notify({ syncing: true, pending: pending.length - done, done });
  }

  syncing = false;
  notify({ syncing: false, pending: 0, done });
}

export async function syncLocations(): Promise<void> {
  const pending = await locationQueueGetAll();
  if (pending.length === 0) return;

  const last = pending[pending.length - 1] as { lat?: number; lng?: number; speed?: number; heading?: number };
  if (typeof last.lat === 'number' && typeof last.lng === 'number') {
    await updateDriverLocation({
      lat: last.lat,
      lng: last.lng,
      speed: typeof last.speed === 'number' ? last.speed : undefined,
      heading: typeof last.heading === 'number' ? last.heading : undefined,
    });
    await locationQueueClear();
  }
}

export function registerBackgroundSync(): void {
  // PWA-DISABLED: sync via IndexedDB queue when online (no service worker Background Sync).
  void syncBookings();

  /* ===== PWA-DISABLED START (docs/FIREBASE_DISABLE_AND_RESTORE.md) =====
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    void syncBookings();
    return;
  }

  navigator.serviceWorker.ready
    .then((reg) => {
      const sync = (reg as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } })
        .sync;
      if (sync) {
        void sync.register('sync-bookings').catch(() => {
          void syncBookings();
        });
        void syncBookings();
      } else {
        void syncBookings();
      }
    })
    .catch(() => {
      void syncBookings();
    });
  ===== PWA-DISABLED END ===== */
}

export function setupNetworkSyncListener(): void {
  if (typeof window === 'undefined') return;

  if (navigator.onLine) {
    registerBackgroundSync();
    void syncLocations();
  }

  window.addEventListener('online', () => {
    registerBackgroundSync();
    void syncLocations();
  });
}
