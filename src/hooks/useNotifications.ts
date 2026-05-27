// src/hooks/useNotifications.ts
import { useCallback } from 'react';
import type { UserNotification } from '@/api/notifications';
import { usePrivateChannel } from './usePrivateChannel';

export type IncomingNotification = UserNotification;

interface UseNotificationsOptions {
  userId: number | null;
  onNotification: (notification: IncomingNotification) => void;
}

export function useNotifications({ userId, onNotification }: UseNotificationsOptions) {
  const channelName = userId ? `notifications.${userId}` : null;

  const handleNotification = useCallback(
    (data: unknown) => {
      onNotification(data as IncomingNotification);
    },
    [onNotification],
  );

  usePrivateChannel(channelName, {
    'user.notification.created': handleNotification,
  });
}
