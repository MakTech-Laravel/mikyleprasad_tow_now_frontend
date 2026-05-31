import { rideUiStatus, type RidePayload, type RideUiStatus } from '@/api/rides';

/** Poll interval for workflow pages while FCM is disabled. */
export const RIDE_WORKFLOW_POLL_MS = 5000;

const CUSTOMER_WORKFLOW_PREFIXES = [
  '/request-waiting',
  '/request-accepted',
  '/tracking-service',
  '/service-completed',
  '/review-submitted',
] as const;

const LOCKED_UI_STATUSES: RideUiStatus[] = [
  'pending',
  'active',
  'arrived',
  'picked_up',
  'awaiting_confirmation',
];

export function isCustomerRideLocked(ride: RidePayload | null | undefined): boolean {
  if (!ride) return false;
  return LOCKED_UI_STATUSES.includes(rideUiStatus(ride));
}

export function customerWorkflowPath(ride: RidePayload): string | null {
  const ui = rideUiStatus(ride);
  const id = ride.id;

  switch (ui) {
    case 'pending':
      return `/request-waiting?rideId=${id}`;
    case 'active':
      return `/request-accepted?rideId=${id}`;
    case 'arrived':
    case 'picked_up':
    case 'awaiting_confirmation':
      return `/tracking-service?rideId=${id}`;
    case 'completed':
      return `/service-completed?rideId=${id}`;
    case 'cancelled':
    case 'expired':
      return null;
    default:
      return `/request-waiting?rideId=${id}`;
  }
}

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Whether the customer may stay on this path while ride-locked.
 */
export function isCustomerPathAllowedWhileLocked(
  pathname: string,
  ride: RidePayload,
): boolean {
  if (CUSTOMER_WORKFLOW_PREFIXES.some((p) => pathMatchesPrefix(pathname, p))) {
    return true;
  }

  if (pathMatchesPrefix(pathname, '/rate-experience')) {
    return pathname === `/rate-experience/${ride.id}` || pathname.startsWith(`/rate-experience/${ride.id}/`);
  }

  if (pathMatchesPrefix(pathname, '/rides') && pathname.endsWith('/live')) {
    const segment = pathname.replace(/^\/rides\//, '').replace(/\/live$/, '');
    return segment === String(ride.id) || segment === ride.uuid;
  }

  if (pathMatchesPrefix(pathname, '/messages') && ride.conversation_id) {
    const convId = pathname.replace(/^\/messages\//, '').split('/')[0];
    return convId === String(ride.conversation_id);
  }

  return false;
}

/**
 * Legal/static paths drivers may visit without being redirected to the driver app.
 */
export const DRIVER_BOOKING_EXEMPT_PATHS = ['/terms', '/privacy', '/contact-us'] as const;

export function isDriverBookingExemptPath(pathname: string): boolean {
  return DRIVER_BOOKING_EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function driverActiveRideDetailPath(ride: RidePayload): string {
  return `/driver-app/rides/detail/${ride.uuid ?? ride.id}`;
}

export function isDriverPathAllowedWhileActiveRideLocked(
  pathname: string,
  ride: RidePayload,
): boolean {
  const detailPath = driverActiveRideDetailPath(ride);
  if (pathname === detailPath || pathname.startsWith(`${detailPath}/`)) {
    return true;
  }

  if (pathMatchesPrefix(pathname, '/driver-app/notifications')) {
    return true;
  }

  if (pathMatchesPrefix(pathname, '/driver-app/bookings/messages') && ride.conversation_id) {
    const convId = pathname.replace(/^\/driver-app\/bookings\/messages\//, '').split('/')[0];
    return convId === String(ride.conversation_id);
  }

  return false;
}

export function normalizeWorkflowPath(path: string): string {
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const qs = new URLSearchParams(sorted).toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function workflowPathsMatch(a: string, b: string): boolean {
  return normalizeWorkflowPath(a) === normalizeWorkflowPath(b);
}
