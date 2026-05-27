import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Clock, Inbox, SearchX } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

import {
  fetchNotifications,
  markAllNotificationsRead,
  NOTIFICATION_LIST_PAGE_SIZE,
  type UserNotification,
} from '@/api/notifications';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function formatListTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function parsePageParam(raw: string | null): number {
  const n = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

const EMPTY_COPY: Record<
  'user' | 'admin' | 'driver',
  { title: string; description: string }
> = {
  user: {
    title: 'No notifications yet',
    description: 'Ride updates, driver messages, and account alerts will appear here when something happens.',
  },
  admin: {
    title: 'No notifications',
    description: 'System alerts, ride events, and administrative notices will show up here.',
  },
  driver: {
    title: 'No notifications yet',
    description: 'New ride requests, ETA changes, and trip updates will appear here.',
  },
};

function NotificationListSkeleton({ variant }: { variant: 'card' | 'plain' }) {
  const rows = Array.from({ length: 6 }, (_, i) => i);
  if (variant === 'plain') {
    return (
      <div className="flex flex-col gap-2">
        {rows.map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-card px-5 py-4"
          >
            <Skeleton className="mt-0.5 size-[22px] shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5 max-w-[240px]" />
              <Skeleton className="h-3 w-full max-w-[320px]" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {rows.map((i, idx) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-4 px-5 py-4',
            idx < rows.length - 1 && 'border-b border-border',
          )}
        >
          <Skeleton className="mt-0.5 size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-2/3 max-w-[280px]" />
            <Skeleton className="h-3 w-full max-w-[360px]" />
          </div>
          <Skeleton className="h-3 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function NotificationEmptyState({
  variant,
  audience,
}: {
  variant: 'card' | 'plain';
  audience: 'user' | 'admin' | 'driver';
}) {
  const copy = EMPTY_COPY[audience];
  const inner = (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-7" aria-hidden />
      </div>
      <h2 className="font-montserrat text-lg font-semibold text-foreground">{copy.title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
    </div>
  );

  if (variant === 'card') {
    return <div className="overflow-hidden rounded-xl border border-border bg-card">{inner}</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-dashed border-border bg-muted/30">{inner}</div>
  );
}

/** This page number returned no rows (invalid or stale URL). */
function NotificationsNotFoundOnPage({
  variant,
  page,
  lastPageWithData,
  onGoFirst,
}: {
  variant: 'card' | 'plain';
  page: number;
  lastPageWithData: number;
  onGoFirst: () => void;
}) {
  const beyondLast = page > lastPageWithData;
  const inner = (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-7" aria-hidden />
      </div>
      <h2 className="font-montserrat text-lg font-semibold text-foreground">No notifications found</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        There are no notifications on page {page}.
        {beyondLast && lastPageWithData >= 1 ? (
          <>
            {' '}
            The last page with results is page {lastPageWithData}.
          </>
        ) : null}
      </p>
      <Button type="button" variant="outline" size="sm" className="mt-6" onClick={onGoFirst}>
        Go to first page
      </Button>
    </div>
  );

  if (variant === 'card') {
    return <div className="overflow-hidden rounded-xl border border-border bg-card">{inner}</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-dashed border-border bg-muted/30">{inner}</div>
  );
}

type NotificationListViewProps = {
  listBasePath: string;
  className?: string;
  /** Card shell (admin); plain list (driver / user) */
  variant?: 'card' | 'plain';
  /** Empty-state messaging */
  audience?: 'user' | 'admin' | 'driver';
};

export function NotificationListView({
  listBasePath,
  className,
  variant = 'card',
  audience = 'user',
}: NotificationListViewProps) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePageParam(searchParams.get('page'));

  const updatePageInUrl = useCallback(
    (next: number, replace: boolean) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next <= 1) p.delete('page');
          else p.set('page', String(next));
          return p;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  const listParams = { page, per_page: NOTIFICATION_LIST_PAGE_SIZE } as const;
  const listKey = portalQueryKeys.notifications.list(listParams);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: listKey,
    queryFn: () => fetchNotifications(listParams),
    staleTime: 30_000,
  });

  const totalPages = useMemo(() => {
    const lp = data?.meta?.last_page;
    if (typeof lp === 'number' && lp >= 1) return Math.max(1, lp);
    const total = data?.meta?.total;
    const perPage = data?.meta?.per_page ?? NOTIFICATION_LIST_PAGE_SIZE;
    if (typeof total === 'number' && total > 0) {
      return Math.max(1, Math.ceil(total / perPage));
    }
    return 1;
  }, [data?.meta?.last_page, data?.meta?.per_page, data?.meta?.total]);

  const totalCount = data?.meta?.total;

  /** Keeps pager usable when URL page exceeds API last_page (no auto-redirect). */
  const paginationTotalPages = Math.max(totalPages, page);

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      updatePageInUrl(1, true);
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const items = data?.data ?? [];
  const hasUnreadOnPage = items.some((n) => !n.read_at);
  /** First page, no rows: treat as empty inbox (covers missing `meta.total` from API). */
  const isTrulyEmpty =
    !isLoading &&
    !isError &&
    items.length === 0 &&
    page === 1 &&
    (typeof totalCount !== 'number' || totalCount === 0);
  const showMarkAll =
    !isLoading &&
    !isError &&
    !isTrulyEmpty &&
    (items.length > 0 || (typeof totalCount === 'number' && totalCount > 0)) &&
    hasUnreadOnPage;

  const listBody = (
    <>
      {isLoading ? (
        <NotificationListSkeleton variant={variant} />
      ) : isError ? (
        <div className="px-5 py-8">
          <p className="text-sm text-destructive">Could not load notifications.</p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : isTrulyEmpty ? (
        <NotificationEmptyState variant={variant} audience={audience} />
      ) : items.length === 0 ? (
        <NotificationsNotFoundOnPage
          variant={variant}
          page={page}
          lastPageWithData={totalPages}
          onGoFirst={() => updatePageInUrl(1, true)}
        />
      ) : (
        items.map((n, i) => (
          <NotificationRow
            key={n.id}
            notification={n}
            basePath={listBasePath.replace(/\/$/, '')}
            listSearch={searchParams.toString()}
            isLast={i === items.length - 1}
            variant={variant}
          />
        ))
      )}
    </>
  );

  const summaryText = useMemo(() => {
    if (isLoading) return null;
    if (isTrulyEmpty) return null;
    if (items.length === 0) {
      if (typeof totalCount === 'number' && totalCount > 0) {
        return `Page ${page} of ${totalPages} · No notifications on this page`;
      }
      return `Page ${page} · No notifications found`;
    }
    if (typeof totalCount !== 'number') return null;
    if (totalCount === 0) return null;
    const metaFrom = data?.meta?.from;
    const metaTo = data?.meta?.to;
    if (typeof metaFrom === 'number' && typeof metaTo === 'number') {
      return `Showing ${metaFrom}–${metaTo} of ${totalCount}`;
    }
    const perPage = data?.meta?.per_page ?? NOTIFICATION_LIST_PAGE_SIZE;
    return `Showing ${(page - 1) * perPage + 1}–${(page - 1) * perPage + items.length} of ${totalCount}`;
  }, [
    isLoading,
    totalCount,
    items.length,
    isTrulyEmpty,
    page,
    totalPages,
    data?.meta?.from,
    data?.meta?.to,
    data?.meta?.per_page,
  ]);

  const summaryLine =
    summaryText !== null ? <p className="text-xs text-muted-foreground">{summaryText}</p> : null;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {isLoading ? <Skeleton className="h-4 w-48 max-w-full" /> : summaryLine}
        </div>
        {showMarkAll ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      {variant === 'card' ? (
        <div
          className={cn(
            'overflow-hidden rounded-xl border border-border bg-card',
            isFetching && !isLoading && 'opacity-80 transition-opacity',
          )}
        >
          {listBody}
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col gap-2',
            isFetching && !isLoading && 'opacity-80 transition-opacity',
          )}
        >
          {listBody}
        </div>
      )}

      {!isLoading && !isError && !isTrulyEmpty ? (
        <PaginationControls
          currentPage={page}
          totalPages={paginationTotalPages}
          onPageChange={(p) => updatePageInUrl(p, false)}
        />
      ) : null}
    </div>
  );
}

function NotificationRow({
  notification: n,
  basePath,
  listSearch,
  isLast,
  variant,
}: {
  notification: UserNotification;
  basePath: string;
  listSearch: string;
  isLast: boolean;
  variant: 'card' | 'plain';
}) {
  const unread = !n.read_at;
  const href = listSearch ? `${basePath}/${n.id}?${listSearch}` : `${basePath}/${n.id}`;

  if (variant === 'plain') {
    return (
      <Link
        to={href}
        className={cn(
          'flex items-start gap-3 rounded-xl bg-white px-5 py-4 transition-colors hover:bg-muted/40 dark:bg-card dark:hover:bg-muted/20',
          unread && 'ring-1 ring-primary/20',
        )}
      >
        <div className="mt-0.5 shrink-0">
          {unread ? (
            <Bell size={22} className="text-primary" />
          ) : (
            <Bell size={22} className="text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground">{n.title}</p>
          {n.body ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
          ) : null}
          <div className="mt-1 flex items-center gap-1">
            <Clock size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{formatListTime(n.created_at)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className={cn(
        'flex items-start gap-4 px-5 py-4 transition-colors hover:bg-accent/30',
        !isLast && 'border-b border-border',
        unread && 'bg-primary/5',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          unread ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Bell className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{n.type}</p>
        <p className="font-semibold text-sm text-foreground">{n.title}</p>
        {n.body ? (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
        ) : null}
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">{formatListTime(n.created_at)}</p>
    </Link>
  );
}
