import { request } from '@/api/request';

/** URL segment for `/user/rides/{key}` and `/driver/rides/{key}`: numeric id or ride `uuid` (backend resolves both). */
export type RideRouteKey = string | number;

function rideKeySegment(key: RideRouteKey): string {
  return encodeURIComponent(String(key));
}

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type RideStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'system_cancelled'
  | 'expired'
  | 'requested'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'completed_user'
  | 'completed_driver_pending_user'
  | 'cancelled_by_user'
  | 'cancelled_by_driver';

export type RidePayload = {
  id: number;
  uuid: string;
  status: RideStatus;
  pickup_location: string;
  dropoff_location: string;
  notes?: string | null;
  eta_minutes?: number | null;
  eta_reason?: string | null;
  cancel_reason?: string | null;
  conversation_id?: number | null;
  expires_at?: string | null;
  accepted_at?: string | null;
  arrived_at?: string | null;
  picked_up_at?: string | null;
  completion_requested_at?: string | null;
  completed_at?: string | null;
  total_arrival_minutes?: number | null;
  total_ride_minutes?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  user?: { id: number; name?: string; phone?: string | null };
  driver?: {
    id: number;
    name?: string;
    phone?: string | null;
    address?: string | null;
    avatar_url?: string | null;
  };
  review?: { id: number; rating: number; body: string; created_at: string } | null;
};

export type RideListResponse = {
  data: RidePayload[];
  meta?: {
    total?: number;
    current_page?: number;
    last_page?: number;
  };
};

export async function createRideRequest(payload: {
  driver_id: number;
  pickup_location: string;
  dropoff_location: string;
  notes?: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  offline_temp_id?: string | null;
  synced_from_offline?: boolean;
  problem_type?: string | null;
  problem_description?: string | null;
  estimated_price?: number | null;
  payment_status?: string | null;
}): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>('/user/rides', payload);
  return res.data.data;
}

export type RideTrackPayload = {
  id: number;
  uuid: string;
  status: string;
  updated_at: string | null;
  driver: {
    id: number;
    name: string | null;
    phone: string | null;
    current_lat: number | null;
    current_lng: number | null;
    location_updated_at: string | null;
  } | null;
};

/** Lightweight polling payload; `key` may be ride id or uuid. */
export async function fetchRideTrack(rideKey: RideRouteKey): Promise<RideTrackPayload> {
  const res = await request.get<ApiEnvelope<RideTrackPayload>>(`/user/rides/${rideKeySegment(rideKey)}/track`);
  return res.data.data;
}

/** Same response as {@link fetchRideTrack}; uses `/status` path (spec alias). */
export async function fetchRideStatus(rideKey: RideRouteKey): Promise<RideTrackPayload> {
  const res = await request.get<ApiEnvelope<RideTrackPayload>>(`/user/rides/${rideKeySegment(rideKey)}/status`);
  return res.data.data;
}

export type OfflineRideSyncRow = {
  driver_id: number;
  pickup_location: string;
  dropoff_location: string;
  notes?: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  dropoff_lat?: number | null;
  dropoff_lng?: number | null;
  offline_temp_id: string;
  problem_type?: string | null;
  problem_description?: string | null;
  estimated_price?: number | null;
  payment_status?: string | null;
};

export type OfflineSyncResultRow = {
  offline_temp_id: string;
  success: boolean;
  ride?: RidePayload;
  error?: string;
};

export async function offlineSyncRides(rides: OfflineRideSyncRow[]): Promise<{
  results: OfflineSyncResultRow[];
}> {
  const res = await request.post<ApiEnvelope<{ results: OfflineSyncResultRow[] }>>(
    '/user/rides/offline-sync',
    { rides },
  );
  return res.data.data;
}

export async function updateFcmToken(fcm_token: string): Promise<void> {
  await request.put('/fcm-token', { fcm_token });
}

export async function updateDriverLocation(payload: {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
}): Promise<void> {
  await request.put('/driver/location', payload);
}

export async function fetchActiveRide(): Promise<RidePayload | null> {
  const res = await request.get<ApiEnvelope<RidePayload | null>>('/user/rides/active');
  return res.data.data;
}

/** Driver's in-progress ride (active or arrived), same shape as {@link fetchActiveRide}. */
export async function fetchDriverActiveRide(): Promise<RidePayload | null> {
  const res = await request.get<ApiEnvelope<RidePayload | null>>('/driver/rides/active');
  return res.data.data;
}

export async function fetchRideById(rideKey: RideRouteKey): Promise<RidePayload> {
  const res = await request.get<ApiEnvelope<RidePayload>>(`/user/rides/${rideKeySegment(rideKey)}`);
  return res.data.data;
}

export async function fetchDriverRideById(rideKey: RideRouteKey): Promise<RidePayload> {
  const res = await request.get<ApiEnvelope<RidePayload>>(`/driver/rides/${rideKeySegment(rideKey)}`);
  return res.data.data;
}

export async function fetchAdminRideById(rideId: string | number): Promise<RidePayload> {
  const res = await request.get<ApiEnvelope<RidePayload>>(`/admin/rides/${rideId}`);
  return res.data.data;
}

export async function cancelRide(rideKey: RideRouteKey, reason?: string): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(`/user/rides/${rideKeySegment(rideKey)}/cancel`, {
    reason,
  });
  return res.data.data;
}

/** True once pickup arrival is recorded (required before user complete / driver completion request). */
export function ridePickupArrived(ride: Pick<RidePayload, 'status' | 'arrived_at' | 'picked_up_at'>): boolean {
  return Boolean(
    ride.arrived_at ||
      ride.picked_up_at ||
      ride.status === 'arrived' ||
      ride.status === 'picked_up',
  );
}

export async function markRideArrivedAsUser(rideKey: RideRouteKey): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(`/user/rides/${rideKeySegment(rideKey)}/arrived`);
  return res.data.data;
}

export async function markRideArrivedAsDriver(rideKey: RideRouteKey): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(`/driver/rides/${rideKeySegment(rideKey)}/arrived`);
  return res.data.data;
}

export async function completeRideAsUser(rideKey: RideRouteKey): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(`/user/rides/${rideKeySegment(rideKey)}/complete`);
  return res.data.data;
}

export async function approveRideCompletion(rideKey: RideRouteKey): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(
    `/user/rides/${rideKeySegment(rideKey)}/complete/approve`,
  );
  return res.data.data;
}

export async function fetchDriverIncomingRides(): Promise<RidePayload[]> {
  const res = await request.get<ApiEnvelope<RideListResponse>>('/driver/rides/incoming');
  return res.data.data?.data ?? [];
}

export async function acceptRide(
  rideKey: RideRouteKey,
  etaMinutes: number,
): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(`/driver/rides/${rideKeySegment(rideKey)}/accept`, {
    eta_minutes: etaMinutes,
  });
  return res.data.data;
}

export async function updateRideEta(
  rideKey: RideRouteKey,
  payload: { eta_minutes: number; reason: string },
): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(`/driver/rides/${rideKeySegment(rideKey)}/eta`, payload);
  return res.data.data;
}

export async function requestRideCompletionByDriver(rideKey: RideRouteKey): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(
    `/driver/rides/${rideKeySegment(rideKey)}/complete-request`,
  );
  return res.data.data;
}

export async function cancelRideAsDriver(
  rideKey: RideRouteKey,
  reason?: string,
): Promise<RidePayload> {
  const res = await request.post<ApiEnvelope<RidePayload>>(`/driver/rides/${rideKeySegment(rideKey)}/cancel`, {
    reason,
  });
  return res.data.data;
}

export function normalizeRideStatus(
  status: string,
): 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' {
  if (status === 'pending' || status === 'requested') return 'pending';
  if (status === 'completed_driver_pending_user') return 'completed';
  if (status === 'completed' || status === 'completed_user' || status.includes('completed'))
    return 'completed';
  if (
    status === 'cancelled' ||
    status.includes('cancel') ||
    status === 'cancelled_by_user' ||
    status === 'cancelled_by_driver'
  )
    return 'cancelled';
  if (status === 'expired' || status.includes('expired')) return 'expired';
  return 'active';
}

/** Fine-grained status for UI badges and copy (single source of truth across portals). */
export type RideUiStatus =
  | 'pending'
  | 'active'
  | 'arrived'
  | 'picked_up'
  | 'awaiting_confirmation'
  | 'completed'
  | 'cancelled'
  | 'expired';

export function rideUiStatus(
  ride: Pick<RidePayload, 'status' | 'arrived_at' | 'picked_up_at'>,
): RideUiStatus {
  const s = ride.status;
  if (s === 'expired' || String(s).includes('expired')) return 'expired';
  if (
    s === 'cancelled' ||
    s === 'system_cancelled' ||
    s === 'cancelled_by_user' ||
    s === 'cancelled_by_driver' ||
    (String(s).includes('cancel') && s !== 'requested')
  )
    return 'cancelled';
  if (s === 'completed' || s === 'completed_user') return 'completed';
  if (s === 'completed_driver_pending_user') return 'awaiting_confirmation';
  if (s === 'pending' || s === 'requested') return 'pending';
  if (s === 'picked_up' || ride.picked_up_at) return 'picked_up';
  if (ridePickupArrived(ride)) return 'arrived';
  return 'active';
}

export function isRideCancelableByUser(uiStatus: RideUiStatus): boolean {
  return (
    uiStatus !== 'completed' &&
    uiStatus !== 'cancelled' &&
    uiStatus !== 'expired' &&
    (uiStatus === 'pending' ||
      uiStatus === 'active' ||
      uiStatus === 'arrived' ||
      uiStatus === 'picked_up' ||
      uiStatus === 'awaiting_confirmation')
  );
}

export function rideUiStatusLabel(status: RideUiStatus): string {
  const labels: Record<RideUiStatus, string> = {
    pending: 'Pending',
    active: 'Active',
    arrived: 'Arrived',
    picked_up: 'Picked up',
    awaiting_confirmation: 'Awaiting confirmation',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired',
  };
  return labels[status];
}

/**
 * @deprecated Prefer `rideUiStatus` + `rideUiStatusLabel` for new code.
 * Kept for call sites that expect the older narrow union.
 */
export function rideHistoryDisplayStatus(
  ride: Pick<RidePayload, 'status' | 'arrived_at' | 'picked_up_at'>,
): RideUiStatus {
  return rideUiStatus(ride);
}
