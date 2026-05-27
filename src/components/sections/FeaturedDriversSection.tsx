import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import StarRating from '@/components/star-rating';
import { MapPin } from 'lucide-react';
import Section from '@/components/section';
import { Link } from 'react-router-dom';
import {
  buildDriversCacheKey,
  fetchDriversPage,
} from '@/features/townow-flow/fetchDriversPage';
import type { Driver } from '@/features/townow-flow/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { useDelayedFlag } from '@/hooks/useDelayedFlag';
import { useNetworkCachedQuery } from '@/hooks/useNetworkCachedQuery';
import { dedupeById } from '@/lib/dedupeById';
import { getQueryDisplayState } from '@/lib/queryDisplayState';
import { cn } from '@/lib/utils';

const SCROLL_THRESHOLD = 4;
const FEATURED_PAGE_SIZE = 8;

function FeaturedDriverSkeletonCard() {
  return (
    <Card className="h-full rounded-2xl border-border bg-background shadow-sm">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-col items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="mt-auto h-10 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}

function FeaturedDriverCard({
  driver,
  index,
  animated = true,
}: {
  driver: Driver;
  index: number;
  animated?: boolean;
}) {
  const isOnline = driver.status === 'Online';
  const inner = (
    <Card className="h-full rounded-2xl border-border bg-background shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-col items-start gap-3">
          <Link
            to={`/driver/${driver.id}`}
            aria-label={`View ${driver.name}'s profile`}
            className="block"
          >
            <Avatar className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground">
              <AvatarImage src={driver.avatar_url} alt={driver.name} />
              <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
                {driver.initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col items-start gap-1">
            <Link
              to={`/driver/${driver.id}`}
              aria-label={`View ${driver.name}'s profile`}
              className="font-semibold"
            >
              {driver.name}
            </Link>
            <div className="flex items-center gap-1">
              <StarRating rating={driver.rating} />
              <span className="text-xs text-muted-foreground">
                {driver.rating} ({driver.reviews})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {driver.location}
          </span>
          <span className="flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-muted-foreground'
              }`}
            />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <Link
          to={`/request-service/${driver.id}`}
          aria-label={`Request service from ${driver.name}`}
        >
          <Button variant="outline" size="lg" className="mt-auto w-full cursor-pointer rounded-xl">
            Request Service
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  if (!animated) return inner;

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
    >
      {inner}
    </motion.div>
  );
}

export default function FeaturedDriversSection() {

  const featuredCacheKey = useMemo(
    () =>
      buildDriversCacheKey({
        page: 1,
        pageSize: FEATURED_PAGE_SIZE,
        tab: 'featured_drivers',
      }),
    [],
  );

  const featuredQuery = useNetworkCachedQuery({
    queryKey: ['featured-drivers-home'],
    networkCacheKey: featuredCacheKey,
    queryFn: ({ signal }) =>
      fetchDriversPage({
        page: 1,
        pageSize: FEATURED_PAGE_SIZE,
        signal,
        tab: 'featured_drivers',
      }),
    staleTime: 30_000,
    select: (chunk) => ({
      ...chunk,
      items: dedupeById(chunk.items, (driver) => driver.id, { strategy: 'last' }),
    }),
  });

  const drivers = featuredQuery.data?.items ?? [];
  const { showInitialSkeleton, isBackgroundRefresh } = getQueryDisplayState(featuredQuery, drivers.length);
  const isCarousel = drivers.length > SCROLL_THRESHOLD;
  const showingCachedDrivers = featuredQuery.isOfflineFallback;
  const showSlowHint = useDelayedFlag(featuredQuery.isPending, 8_000);

  return (
    <Section variant="alternate" applyContainer>
      <Section.Heading title="Featured Drivers" subtitle="Trusted professionals ready to help" />
      {showingCachedDrivers ? (
        <p className="mb-3 text-xs text-amber-700">Showing cached drivers from this device.</p>
      ) : null}
      {isBackgroundRefresh ? (
        <p className="mb-3 text-xs text-muted-foreground">Updating drivers…</p>
      ) : null}

      {showInitialSkeleton ? (
        <div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <FeaturedDriverSkeletonCard key={idx} />
            ))}
          </div>
          {showSlowHint ? (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Loading is taking longer than usual on this network.
              </p>
              <div className="mt-3">
                <Button variant="outline" onClick={() => void featuredQuery.refetch()}>
                  Retry now
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : featuredQuery.isError && drivers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background/80 p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-secondary">
            <MapPin className="h-5 w-5" />
          </div>
          <h3 className="font-montserrat text-xl font-semibold text-foreground">
            Network is too slow right now
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            We could not load featured drivers on this connection. Please retry, or open the full
            drivers page once the connection is stable.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              className="cursor-pointer rounded-xl"
              size="lg"
              onClick={() => void featuredQuery.refetch()}
            >
              Retry Loading
            </Button>
            <Link to="/find-drivers">
              <Button variant="outline" className="cursor-pointer rounded-xl" size="lg">
                Browse All Drivers
              </Button>
            </Link>
          </div>
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background/80 p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-secondary">
            <MapPin className="h-5 w-5" />
          </div>
          <h3 className="font-montserrat text-xl font-semibold text-foreground">No Featured Drivers Yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            We could not find any approved and non-suspended featured drivers at the moment. Check
            the full directory for all available drivers.
          </p>
          <div className="mt-6">
            <Link to="/find-drivers">
              <Button className="cursor-pointer rounded-xl" size="lg">
                Browse All Drivers
              </Button>
            </Link>
          </div>
        </div>
      ) : isCarousel ? (
        <Carousel
          opts={{
            align: 'start',
            loop: false,
            dragFree: true,
          }}
          className={cn('w-full', isBackgroundRefresh && 'opacity-80 transition-opacity')}
        >
          <CarouselContent className="-ml-4 py-2">
            {drivers.map((driver, i) => (
              <CarouselItem key={driver.id} className="basis-[85%] pl-4 sm:basis-1/2 lg:basis-1/4">
                <FeaturedDriverCard driver={driver} index={i} animated={false} />
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-6 flex items-center justify-center gap-3">
            <CarouselPrevious className="static translate-y-0 cursor-pointer" />
            <CarouselNext className="static translate-y-0 cursor-pointer" />
          </div>
        </Carousel>
      ) : (
        <div
          className={cn(
            'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4',
            isBackgroundRefresh && 'opacity-80 transition-opacity',
          )}
        >
          {drivers.map((driver, i) => (
            <FeaturedDriverCard key={driver.id} driver={driver} index={i} />
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link to="/find-drivers">
          <Button className="cursor-pointer rounded-xl" size="lg">
            View All Drivers
          </Button>
        </Link>
      </div>
    </Section>
  );
}
