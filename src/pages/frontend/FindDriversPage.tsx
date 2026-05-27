import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Funnel, MapPin, Phone, Search } from 'lucide-react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  buildDriversCacheKey,
  fetchDriversPage,
  type DriversPageChunk,
} from '@/features/townow-flow/fetchDriversPage';
import type { Driver } from '@/features/townow-flow/types';
import {
  flattenInfinitePages,
  infinitePagesFromCache,
  useInfiniteWindowQuery,
} from '@/features/infinite-scroll/useInfiniteWindowQuery';
import { getQueryDisplayState } from '@/lib/queryDisplayState';
import { cn } from '@/lib/utils';
import Section from '@/components/section';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StarRating from '@/components/star-rating';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 10;

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DriverCardSkeleton() {
  return (
    <Card className="rounded-xl border border-border bg-background">
      <CardContent className="p-4">
        {/* Top row — mirrors real card structure */}
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-full max-w-[180px]" />
          </div>
          {/* Right badge — stays in place */}
          <div className="shrink-0 space-y-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-14 ml-auto" />
          </div>
        </div>
        {/* Actions */}
        <div className="mt-3.5 flex items-center gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Driver Card ─────────────────────────────────────────────────────────────

function DriverCard({ driver }: { driver: Driver }) {
  return (
    <Card className="rounded-xl border border-border bg-background">
      <CardContent className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3 border-b border-border pb-4">

          {/* Left: avatar + info — min-w-0 lets this shrink so right side never overflows */}
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Link
              to={`/driver/${driver.id}`}
              aria-label={`View ${driver.name}'s profile`}
              className="block shrink-0"
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/50 font-semibold">
                  {driver.initials}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="min-w-0 space-y-1">
              <Link
                to={`/driver/${driver.id}`}
                aria-label={`View ${driver.name}'s profile`}
                className="block"
              >
                <span className="block truncate font-semibold">{driver.name}</span>
              </Link>

              <p className="flex items-center gap-1 text-xs text-muted">
                <StarRating rating={driver.rating} size="h-3.5 w-3.5" />
                <span className="shrink-0">
                  {driver.rating} ({driver.reviews} reviews)
                </span>
              </p>

              {/* Location + status — truncate the address, keep status visible */}
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{driver.location}</span>
                <span
                  className={cn(
                    'shrink-0',
                    driver.status === 'Online' && 'font-medium text-emerald-600',
                  )}
                >
                  • {driver.status}
                </span>
              </p>
            </div>
          </div>

          {/* Right: pricing badge — shrink-0 keeps it fixed width, never pushed off screen */}
          <div className="shrink-0 text-right text-xs text-gray-500">
            <Badge className="bg-primary/15 text-secondary">{driver.pricing}</Badge>
            <p className="mt-0.5 whitespace-nowrap">{driver.responseTime}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3.5 flex items-center gap-2">
          <Link
            to={`/request-service/${driver.id}`}
            aria-label={`Request service from ${driver.name}`}
            className="flex-1"
          >
            <Button className="w-full cursor-pointer rounded-xl">Request Service</Button>
          </Link>
          <Button
            asChild
            variant="outline"
            size="icon"
            className="shrink-0 cursor-pointer rounded-xl"
          >
            <a href={`tel:${driver.phoneNumber}`} aria-label={`Call ${driver.name}`}>
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sentinel ────────────────────────────────────────────────────────────────

function Sentinel({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onVisible(); },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible]);

  return <div ref={ref} className="h-1 w-full" />;
}

// ─── Filter options ───────────────────────────────────────────────────────────

const FilterOption = [
  { label: 'All Status', value: 'All Status' },
  { label: 'Online', value: 'Online' },
  { label: 'Offline', value: 'Offline' },
] as const;

type StatusFilter = (typeof FilterOption)[number]['value'];

function statusFilterFromQuery(status: string | null): StatusFilter {
  const normalized = (status ?? '').trim().toLowerCase();
  if (normalized === 'online') return 'Online';
  if (normalized === 'offline') return 'Offline';
  return 'All Status';
}

// ─── Search bar ───────────────────────────────────────────────────────────────

function DriverSearchBar({
  defaultValue,
  statusFilter,
  onSearch,
}: {
  defaultValue: string;
  statusFilter: StatusFilter;
  onSearch: (value: string, status: StatusFilter) => void;
}) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const submit = () => onSearch(inputValue, statusFilter);

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          className="h-10 pl-9 text-sm"
          placeholder="Search by name or zone..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
      </div>
      <Button onClick={submit} size="lg" className="cursor-pointer rounded-xl">
        <Search className="h-4 w-4" />
        {/* Hide label on very small screens to save space */}
        <span className="hidden sm:inline">Find Drivers</span>
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FindDriversPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const statusFilter = statusFilterFromQuery(searchParams.get('status'));
  const statusParam = statusFilter === 'All Status' ? undefined : statusFilter;

  const listCacheKey = useMemo(
    () =>
      buildDriversCacheKey({
        page: 1,
        pageSize: PAGE_SIZE,
        q: search || undefined,
        status: statusParam,
        tab: 'all',
      }),
    [search, statusParam],
  );

  const infinite = useInfiniteWindowQuery<Driver, DriversPageChunk>({
    queryKey: ['tow-drivers', PAGE_SIZE, search, statusParam],
    networkCacheKey: listCacheKey,
    fetchPage: (page, signal) =>
      fetchDriversPage({
        page,
        pageSize: PAGE_SIZE,
        signal,
        q: search || undefined,
        status: statusParam,
        tab: 'all',
      }),
  });

  const items = useMemo(() => flattenInfinitePages(infinite.data, (d) => d.id), [infinite.data]);

  const showingCachedDrivers = useMemo(
    () => infinite.isError && infinitePagesFromCache(infinite.data),
    [infinite.data, infinite.isError],
  );

  const totalCount = useMemo(() => {
    const firstPage = infinite.data?.pages[0];
    if (!firstPage || !('total' in firstPage)) return null;
    const total = firstPage.total;
    return typeof total === 'number' ? total : null;
  }, [infinite.data]);

  const onlineCount = useMemo(() => items.filter((d) => d.status === 'Online').length, [items]);

  const { showInitialSkeleton, isBackgroundRefresh } = getQueryDisplayState(infinite, items.length);

  const writeQueryParams = useCallback(
    (nextSearch: string, nextStatus: StatusFilter) => {
      const next = new URLSearchParams(searchParams);
      const trimmed = nextSearch.trim();
      if (trimmed) next.set('search', trimmed); else next.delete('search');
      if (nextStatus === 'All Status') next.delete('status');
      else next.set('status', nextStatus.toLowerCase());
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const fetchMore = useCallback(() => {
    if (infinite.hasNextPage && !infinite.isFetchingNextPage) void infinite.fetchNextPage();
  }, [infinite]);

  return (
    <>
      <PageMeta
        title="Find Drivers"
        description="Browse available tow truck drivers near you."
        keywords={['find drivers', 'tow truck']}
      />

      {/* Hero */}
      <Section variant="alternate" applyContainer className="border-b border-border">
        <Section.Heading
          title="Available Drivers"
          subtitle="Find and connect with tow truck drivers in your area"
          className="m-0"
        />
      </Section>

      {/* Search + counts */}
      <Section applyContainer className="border-b border-border pb-5">
        <DriverSearchBar
          key={search}
          defaultValue={search}
          statusFilter={statusFilter}
          onSearch={writeQueryParams}
        />
        <div className="mt-5 flex items-center justify-between text-xs">
          <span>Showing {items.length} of {totalCount ?? items.length} drivers</span>
          <span>{onlineCount} online now</span>
        </div>
        {showingCachedDrivers && (
          <p className="mt-2 text-xs text-amber-700">
            Offline fallback: showing cached drivers stored on this device.
          </p>
        )}
        {isBackgroundRefresh && (
          <p className="mt-2 text-xs text-muted-foreground">Updating drivers…</p>
        )}
      </Section>

      {/* List */}
      <Section applyContainer>
        {/* List header — stacks vertically on mobile, side-by-side on sm+ */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Available Drivers</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Find and connect with tow truck drivers in your area
            </p>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Funnel className="h-4 w-4 shrink-0 text-muted" />
            <p className="shrink-0 text-sm text-muted">Status:</p>
            <Select
              aria-label="Status filter"
              value={statusFilter}
              onValueChange={(value: string) => writeQueryParams(search, value as StatusFilter)}
            >
              <SelectTrigger className="cursor-pointer rounded-xl border border-border py-2 shadow-xs transition-all hover:border-border focus:ring-2 focus:ring-input focus:outline-none">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent className="mt-1 w-full overflow-hidden rounded-lg border border-border shadow-lg">
                {FilterOption.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="cursor-pointer px-4 py-2">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards */}
        <div className={cn('space-y-3', isBackgroundRefresh && items.length > 0 && 'opacity-80 transition-opacity')}>
          {showInitialSkeleton
            ? Array.from({ length: 6 }).map((_, idx) => <DriverCardSkeleton key={idx} />)
            : null}

          {!showInitialSkeleton
            ? items.map((driver) => <DriverCard key={driver.id} driver={driver} />)
            : null}

          {!showInitialSkeleton && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-accent/60 px-6 py-14 text-center">
              <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-secondary">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-montserrat text-xl font-semibold text-foreground">
                No Drivers Found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                We could not find drivers matching your filters. Try a different search term or set
                status back to All Status.
              </p>
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="cursor-pointer rounded-xl"
                  onClick={() => writeQueryParams('', 'All Status')}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {infinite.hasNextPage && <Sentinel onVisible={fetchMore} />}

        {infinite.isFetchingNextPage && (
          <p className="py-4 text-center text-xs">Loading more drivers…</p>
        )}

        {!infinite.hasNextPage && items.length > 0 && (
          <p className="py-4 text-center text-xs">
            All {totalCount ?? items.length} drivers loaded
          </p>
        )}
      </Section>
    </>
  );
}