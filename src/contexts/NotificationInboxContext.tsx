import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { isDriverAwaitingApproval } from '@/auth/completePassportLogin';
import { useAuth } from '@/auth/useAuth';
import { fetchNotifications, NOTIFICATION_BADGE_PAGE_PARAMS } from '@/api/notifications';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { useNotifications, type IncomingNotification } from '@/hooks/useNotifications';
import { toast } from 'sonner';

type NotificationInboxContextValue = {
  unreadCount: number;
  invalidateNotifications: () => void;
};

const NotificationInboxContext = createContext<NotificationInboxContextValue | null>(
  null,
);

export function NotificationInboxProvider({ children }: { children: ReactNode }) {
  const { user, sessionStatus } = useAuth();
  const inboxEnabled =
    sessionStatus === 'authenticated' && !!user?.id && !isDriverAwaitingApproval(user);
  const queryClient = useQueryClient();
  const listKey = portalQueryKeys.notifications.list(NOTIFICATION_BADGE_PAGE_PARAMS);

  const { data: listData } = useQuery({
    queryKey: listKey,
    queryFn: () => fetchNotifications(NOTIFICATION_BADGE_PAGE_PARAMS),
    enabled: inboxEnabled,
    staleTime: 30_000,
  });

  const onNotification = useCallback(
    (_n: IncomingNotification) => {
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      toast.info(_n.title, { description: _n.body || undefined });
    },
    [queryClient],
  );

  const notificationsUserId = inboxEnabled && user?.id ? user.id : null;

  useNotifications({
    userId: notificationsUserId,
    onNotification,
  });

  const unreadCount = useMemo(() => {
    const rows = listData?.data ?? [];
    return rows.filter((x) => !x.read_at).length;
  }, [listData]);

  const invalidateNotifications = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const value = useMemo(
    () => ({ unreadCount, invalidateNotifications }),
    [unreadCount, invalidateNotifications],
  );

  return (
    <NotificationInboxContext.Provider value={value}>{children}</NotificationInboxContext.Provider>
  );
}

export function useNotificationInbox(): NotificationInboxContextValue {
  const ctx = useContext(NotificationInboxContext);
  if (!ctx) {
    throw new Error('useNotificationInbox must be used within NotificationInboxProvider');
  }
  return ctx;
}
