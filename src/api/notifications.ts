import { request } from '@/api/request';
import { unwrapLaravelData } from '@/api/laravelResponse';
import { unwrapPaginated, type LaravelPaginated } from '@/api/portalShared';

/** Page size for list requests (match API default unless you override in Laravel). */
export const NOTIFICATION_LIST_PAGE_SIZE = 10;

/** First-page fetch for unread badge + header bell (recent window). */
export const NOTIFICATION_BADGE_PAGE_PARAMS = { page: 1, per_page: 100 } as const;

/** Matches REST list/show + Pusher payload (list may omit `user_id`). */
export type UserNotification = {
  id: number;
  user_id?: number;
  sender_id: number | null;
  is_system: boolean;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
  sender?: {
    id: number;
    name: string;
    email?: string;
  } | null;
};

type ListEnvelope = {
  success?: boolean;
  data?: UserNotification[] | LaravelPaginated<UserNotification>;
  message?: string;
};

function normalizeNotificationsList(body: unknown): LaravelPaginated<UserNotification> {
  if (body === null || typeof body !== 'object') {
    return { data: [] };
  }

  const root = body as Record<string, unknown>;

  // Laravel API envelope + LengthAwarePaginator: { success, data: [], meta: {}, links: {} }
  if (Array.isArray(root.data) && root.meta && typeof root.meta === 'object') {
    return {
      data: root.data as UserNotification[],
      meta: root.meta as LaravelPaginated<UserNotification>['meta'],
    };
  }

  if ('data' in root && root.data !== undefined) {
    const inner = root.data;

    if (Array.isArray(inner)) {
      return { data: inner, meta: undefined };
    }

    if (inner && typeof inner === 'object') {
      const o = inner as Record<string, unknown>;
      if (Array.isArray(o.data)) {
        return {
          data: o.data as UserNotification[],
          meta: (o.meta as LaravelPaginated<UserNotification>['meta']) ?? undefined,
        };
      }
    }
  }

  return unwrapPaginated<UserNotification>(body);
}

export async function fetchNotifications(params?: {
  page?: number;
  per_page?: number;
}): Promise<LaravelPaginated<UserNotification>> {
  const res = await request.get<ListEnvelope | Record<string, unknown>>('/notifications', { params });
  return normalizeNotificationsList(res.data);
}

export async function fetchNotification(id: number | string): Promise<UserNotification | null> {
  const res = await request.get<{ success?: boolean; data?: UserNotification }>(`/notifications/${id}`);
  const raw = res.data;
  if (raw && typeof raw === 'object' && 'data' in raw && raw.data) {
    return raw.data;
  }
  return unwrapLaravelData<UserNotification>(raw);
}

export async function markNotificationRead(id: number | string): Promise<void> {
  await request.post(`/notifications/${id}/read`);
}

export async function markNotificationUnread(id: number | string): Promise<void> {
  await request.post(`/notifications/${id}/unread`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await request.post('/notifications/read-all');
}

/* ===== FIREBASE-DISABLED START (docs/FIREBASE_DISABLE_AND_RESTORE.md) =====
export async function sendTestPushToToken(payload: {
  fcm_token: string;
  title?: string;
  body?: string;
}): Promise<{ fcm_message_id: string }> {
  const res = await request.post<{
    success?: boolean;
    message?: string;
    data?: { fcm_message_id?: string };
  }>('/notifications/test-push-token', payload);
  const body = res.data;
  if (body && typeof body === 'object' && body.success === false) {
    throw new Error(typeof body.message === 'string' ? body.message : 'Push send failed');
  }
  const data = unwrapLaravelData<{ fcm_message_id?: string }>(body);
  if (!data?.fcm_message_id) {
    throw new Error('Unexpected response from server.');
  }
  return { fcm_message_id: data.fcm_message_id };
}
===== FIREBASE-DISABLED END ===== */
export async function sendTestPushToToken(_payload: {
  fcm_token: string;
  title?: string;
  body?: string;
}): Promise<{ fcm_message_id: string }> {
  throw new Error('Firebase test push is disabled. See docs/FIREBASE_DISABLE_AND_RESTORE.md');
}
