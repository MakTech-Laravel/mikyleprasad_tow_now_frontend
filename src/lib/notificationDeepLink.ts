import type { UserNotification } from '@/api/notifications';

function rideIdFromData(data: Record<string, unknown> | null): number | null {
  if (!data) return null;
  const v = data.ride_id;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v);
  return null;
}

/**
 * Resolves an in-app path for a notification. Uses `action_url` when it is a path;
 * otherwise uses `data.ride_id` for ride-related screens by role.
 */
export function getNotificationDeepLink(
  notification: Pick<UserNotification, 'type' | 'data' | 'action_url'>,
  role: string,
): string | null {
  const raw = notification.action_url;
  if (typeof raw === 'string' && raw.length > 0) {
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return raw;
  }

  const rideId = rideIdFromData(notification.data);
  if (rideId == null) return null;

  if (role === 'admin') return `/admin/rides/detail/${rideId}`;
  if (role === 'driver') return `/driver-app/rides/detail/${rideId}`;
  return `/rides/${rideId}`;
}
