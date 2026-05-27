import { Link } from 'react-router-dom';
import {
  CheckCircle,
  ChevronRight,
  ClockArrowUp,
  Info,
  MapPin,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { getQueryDisplayState } from '@/lib/queryDisplayState';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Section from '@/components/section';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { fetchUserDashboard } from '@/api/userPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { rideUiStatus, rideUiStatusLabel, type RideUiStatus } from '@/api/rides';

interface DashboardItem {
  title: string;
  icon: LucideIcon;
  value: number;
}

interface ActivityItem {
  driver: string;
  avatar_url: string;
  ride_id: string;
  date: string;
  location: string;
  uiStatus: RideUiStatus;
}

const STATUS_STYLES: Record<RideUiStatus, string> = {
  pending: 'bg-orange-100 text-orange-700',
  active: 'bg-primary/20 text-primary',
  arrived: 'bg-amber-100 text-amber-800',
  picked_up: 'bg-sky-100 text-sky-800',
  awaiting_confirmation: 'bg-violet-100 text-violet-800',
  completed: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-500',
  expired: 'bg-red-100 text-red-500',
};

// ─── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({ item }: { item: ActivityItem }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex items-center justify-between rounded-2xl border bg-input/10 p-4 transition-colors hover:bg-input/20"
    >
      {/* Left: avatar + driver name + location */}
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={item.avatar_url} />
          <AvatarFallback>{item.driver.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex flex-col">
          <Link to={`/user/${item.driver}`} className="truncate text-sm font-semibold">
            {item.driver}
          </Link>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="max-w-[150px] truncate">{item.location}</span>
          </p>
        </div>
      </div>

      {/* Right: badge + date + hover action */}
      <div className="ml-4 flex shrink-0 items-center gap-4">
        <div className="hidden flex-col items-end gap-1 sm:flex">
          <Badge className={cn('px-2 text-[10px]', STATUS_STYLES[item.uiStatus])}>
            {rideUiStatusLabel(item.uiStatus)}
          </Badge>
          <p className="text-xs text-muted-foreground">{item.date}</p>
        </div>

        <AnimatePresence mode="wait">
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, width: 0, x: 20 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Link to={`/rides/${item.ride_id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 cursor-pointer rounded-full border"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function ActivityEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-input/10 px-6 py-10 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-input">
        <ClockArrowUp className="size-5 text-muted-foreground/60" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground">
          Your ride history will appear here once you make your first request.
        </p>
      </div>
      <Link to="/find-drivers">
        <Button size="sm" className="mt-1 cursor-pointer rounded-xl">
          Find a Driver
        </Button>
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const { sessionStatus, user } = useAuth();

  const dashboardQuery = useQuery({
    queryKey: portalQueryKeys.userDashboard,
    queryFn: fetchUserDashboard,
    enabled: sessionStatus === 'authenticated' && Boolean(user),
  });

  const summary = dashboardQuery.data?.summary;

  const dashboardStatsItems: DashboardItem[] = [
    { title: 'Total Rides', icon: TrendingUp, value: summary?.total ?? 0 },
    { title: 'Completed Rides', icon: CheckCircle, value: summary?.completed ?? 0 },
    { title: 'Active Rides', icon: Info, value: summary?.active ?? 0 },
  ];

  const activityItems: ActivityItem[] = (dashboardQuery.data?.recent_rides ?? []).map((ride) => ({
    driver: ride.driver?.name ?? 'Driver',
    avatar_url: ride.driver?.avatar_url ?? '',
    ride_id: String(ride.id),
    date: ride.created_at ? new Date(ride.created_at).toLocaleDateString() : 'Recently',
    location: `${ride.pickup_location} -> ${ride.dropoff_location}`,
    uiStatus: rideUiStatus(ride),
  }));

  const { showInitialSkeleton } = getQueryDisplayState(dashboardQuery, activityItems.length);
  const isEmpty = !showInitialSkeleton && activityItems.length === 0;

  return (
    <>
      <PageMeta
        title="Dashboard"
        description="Your TowTruckTT overview: active rides, shortcuts, and history."
        keywords={['dashboard', 'user', 'tow']}
      />

      {/* Stats grid */}
      <Section className="p-0">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {dashboardStatsItems.map((item) => (
            <Card key={item.title} className="rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
                <span className="inline-flex items-center justify-between rounded-xl bg-input p-4">
                  <item.icon className="size-4" />
                </span>
                <h4 className="text-lg font-semibold">{item.value}</h4>
                <p className="text-sm text-muted">{item.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Recent Activity */}
      <Section>
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-montserrat text-2xl font-semibold tracking-tight">
                Recent Activity
              </h2>
              <Link to="/rides">
                <Button variant="link" size="sm" className="cursor-pointer hover:no-underline">
                  View All <ChevronRight className="size-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-6">
              {/* Skeleton */}
              {showInitialSkeleton && (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-2xl border bg-input/20" />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {isEmpty && <ActivityEmptyState />}

              {/*
               * Cards — wrapped in overflow-x-auto so if card content is wider
               * than the container (e.g. on narrow mobile) it scrolls horizontally
               * instead of breaking the layout. min-w-[480px] keeps each card
               * at a comfortable width on very small screens.
               */}
              {!showInitialSkeleton && !isEmpty && (
                <div className="overflow-x-auto">
                  <div className="min-w-[480px] space-y-4">
                    {activityItems.map((item) => (
                      <ActivityCard key={item.ride_id} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}