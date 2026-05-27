import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  fetchNotification,
  markNotificationRead,
  type UserNotification,
} from '@/api/notifications';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { useAuth } from '@/auth/useAuth';
import { getUserRoles } from '@/auth/roles';
import { Button } from '@/components/ui/button';
import { getNotificationDeepLink } from '@/lib/notificationDeepLink';

type NotificationDetailViewProps = {
  notificationId: string;
  listBasePath: string;
};

export function NotificationDetailView({ notificationId, listBasePath }: NotificationDetailViewProps) {
  const { user } = useAuth();
  const { search } = useLocation();
  const queryClient = useQueryClient();
  const idNum = Number(notificationId);
  const idKey = Number.isFinite(idNum) ? idNum : notificationId;

  const roles = getUserRoles(user);
  const roleForLink = roles.includes('admin')
    ? 'admin'
    : roles.includes('driver')
      ? 'driver'
      : 'user';

  const detailKey = portalQueryKeys.notifications.detail(idKey);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: detailKey,
    queryFn: async () => {
      const row = await fetchNotification(idKey);
      return row;
    },
    enabled: !!notificationId,
  });

  const markReadMutation = useMutation({
    mutationFn: () => markNotificationRead(idKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData<UserNotification | null | undefined>(detailKey, (prev) =>
        prev ? { ...prev, read_at: new Date().toISOString() } : prev,
      );
    },
  });

  const readAttemptedRef = useRef<number | null>(null);
  useEffect(() => {
    readAttemptedRef.current = null;
  }, [notificationId]);

  const { mutate: markRead } = markReadMutation;
  useEffect(() => {
    if (!data || data.read_at) return;
    if (readAttemptedRef.current === data.id) return;
    readAttemptedRef.current = data.id;
    markRead();
  }, [data, markRead]);

  const deepLink = data ? getNotificationDeepLink(data, roleForLink) : null;

  const listHref = `${listBasePath.replace(/\/$/, '')}${search}`;

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (isError || !data) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Notification not found.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
        <div>
          <Button type="button" variant="link" asChild className="px-0">
            <Link to={listHref}>Back to list</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button type="button" variant="ghost" size="sm" className="gap-1.5 px-0" asChild>
        <Link to={listHref}>
          <ArrowLeft className="h-4 w-4" />
          All notifications
        </Link>
      </Button>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{data.type}</p>
        <h1 className="mt-1 font-montserrat text-xl font-bold tracking-tight text-foreground">{data.title}</h1>
        {data.body ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{data.body}</p>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">
          {new Date(data.created_at).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>

        {deepLink ? (
          <div className="mt-6">
            {deepLink.startsWith('/') ? (
              <Button type="button" variant="default" size="sm" asChild>
                <Link to={deepLink} className="inline-flex gap-2">
                  Open related page
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="default" size="sm" asChild>
                <a
                  href={deepLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex gap-2"
                >
                  Open related page
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
