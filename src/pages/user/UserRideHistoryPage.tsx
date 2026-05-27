import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronRight, MapPin, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { CancelRideDialog } from '@/components/rides/CancelRideDialog';
import { PageMeta } from '@/components/seo/PageMeta';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { cn } from '@/lib/utils';
import { getQueryDisplayState } from '@/lib/queryDisplayState';
import { getApiErrorMessage } from '@/lib/error.utils';
import Section from '@/components/section';
import { fetchUserDashboard, fetchUserRideHistory } from '@/api/userPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import {
  cancelRide,
  isRideCancelableByUser,
  rideUiStatus,
  rideUiStatusLabel,
  type RideUiStatus,
} from '@/api/rides';

const PAGE_SIZE = 6;

const HISTORY_STATUS_BADGE: Record<RideUiStatus, string> = {
  pending:
    'rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100',
  active:
    'rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20',
  arrived:
    'rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100',
  picked_up: 'rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100',
  awaiting_confirmation:
    'rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800 hover:bg-violet-100',
  completed:
    'rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-100',
  cancelled: 'rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-100',
  expired: 'rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100',
};

function statusBadge(ui: RideUiStatus) {
  return <Badge className={HISTORY_STATUS_BADGE[ui]}>{rideUiStatusLabel(ui)}</Badge>;
}

function formatRideDate(requestedAt: string) {
  return new Date(requestedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

type RideHistoryItem = {
  id: number;
  driverName: string;
  pickup: string;
  dropoff: string;
  requestedAt: string;
  status: RideUiStatus;
  driver?: {
    name: string;
    avatar_url: string;
  };
};

function RideHistoryCard({
  ride,
  onCancel,
  isCancelling,
}: {
  ride: RideHistoryItem;
  onCancel?: (rideId: number) => void;
  isCancelling?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const showCancel = isRideCancelableByUser(ride.status) && onCancel != null;

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex items-center justify-between rounded-3xl border border-primary/20 bg-input/10 p-4 transition-colors hover:bg-input/20"
    >
      <Link
        to={`/rides/${ride.id}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={ride.driver?.avatar_url || undefined} alt={ride.driverName} />
          <AvatarFallback className="bg-slate-200 text-sm font-semibold text-slate-700">
            {getInitials(ride.driverName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-lg font-semibold text-foreground">{ride.driverName}</h3>
          <p className="flex min-w-0 items-center gap-3 text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate text-sm">{ride.pickup}</span>
            </span>
            <ArrowRight className="size-4 shrink-0" />
            <span className="truncate text-sm">{ride.dropoff}</span>
          </p>
        </div>
      </Link>

      <div className="relative z-20 ml-4 flex shrink-0 items-center gap-2">
        <div className="hidden items-end gap-1 sm:flex sm:flex-col">
          <p className="text-sm text-muted-foreground">{formatRideDate(ride.requestedAt)}</p>
          {statusBadge(ride.status)}
        </div>

        {showCancel ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 cursor-pointer rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10"
            disabled={isCancelling}
            aria-label="Cancel request"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel(ride.id);
            }}
          >
            <X className="size-4" />
          </Button>
        ) : null}

        <AnimatePresence mode="wait">
          {isHovered ? (
            <motion.div
              initial={{ opacity: 0, width: 0, x: 20 }}
              animate={{ opacity: 1, width: 'auto', x: 0 }}
              exit={{ opacity: 0, width: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Button asChild variant="ghost" size="icon" className="size-10 rounded-full border">
                <Link to={`/rides/${ride.id}`}>
                  <ChevronRight className="size-5" />
                </Link>
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function UserRideHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelRideId, setCancelRideId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const ridesQuery = useQuery({
    queryKey: portalQueryKeys.userRides({ page: currentPage }),
    queryFn: () => fetchUserRideHistory({ page: currentPage, per_page: PAGE_SIZE }),
  });

  const dashboardFallbackQuery = useQuery({
    queryKey: portalQueryKeys.userDashboard,
    queryFn: fetchUserDashboard,
    enabled: !!ridesQuery.data && (ridesQuery.data.data?.length ?? 0) === 0,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ rideId, reason }: { rideId: number; reason?: string }) =>
      cancelRide(rideId, reason),
    onSuccess: async () => {
      toast.success('Ride cancelled.');
      setCancelDialogOpen(false);
      setCancelRideId(null);
      await queryClient.invalidateQueries({ queryKey: portalQueryKeys.userDashboard });
      await queryClient.invalidateQueries({ queryKey: ['user', 'rides'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err) ?? 'Could not cancel ride.'),
  });

  const visibleRides: RideHistoryItem[] = (ridesQuery.data?.data ?? []).map((ride) => ({
    id: ride.id,
    driverName: ride.driver?.name ?? 'Driver',
    pickup: ride.pickup_location,
    dropoff: ride.dropoff_location,
    requestedAt: ride.created_at ?? new Date().toISOString(),
    status: rideUiStatus(ride),
    driver: {
      name: ride.driver?.name ?? 'Driver',
      avatar_url: ride.driver?.avatar_url ?? '',
    },
  }));

  const fallbackRides: RideHistoryItem[] = (dashboardFallbackQuery.data?.recent_rides ?? []).map(
    (ride) => ({
      id: ride.id,
      driverName: ride.driver?.name ?? 'Driver',
      pickup: ride.pickup_location,
      dropoff: ride.dropoff_location,
      requestedAt: ride.created_at ?? new Date().toISOString(),
      status: rideUiStatus(ride),
      driver: {
        name: ride.driver?.name ?? 'Driver',
        avatar_url: ride.driver?.avatar_url ?? '',
      },
    }),
  );

  const ridesToRender = visibleRides.length > 0 ? visibleRides : fallbackRides;
  const totalPages = Math.max(1, ridesQuery.data?.meta?.last_page ?? 1);
  const { showInitialSkeleton } = getQueryDisplayState(ridesQuery, ridesToRender.length);
  const isEmpty = !showInitialSkeleton && ridesToRender.length === 0;

  const openCancelDialog = (rideId: number) => {
    setCancelRideId(rideId);
    setCancelDialogOpen(true);
  };

  const confirmCancelRide = (reason?: string) => {
    if (cancelRideId == null) return;
    cancelMutation.mutate({ rideId: cancelRideId, reason });
  };

  return (
    <>
      <CancelRideDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setCancelRideId(null);
        }}
        isPending={cancelMutation.isPending}
        onConfirm={confirmCancelRide}
        title="Cancel request"
        description="Your driver will be notified. You may optionally share a reason."
        confirmLabel="Cancel request"
      />

      <PageMeta
        title="Ride history"
        description="View your past and active tow requests."
        keywords={['rides', 'history', 'tow']}
      />

      <Section className="space-y-5 p-0">
        <Card className={cn('rounded-2xl border-none bg-transparent shadow-none')}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[520px] space-y-4">
                {showInitialSkeleton &&
                  [1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-3xl border border-primary/20 bg-input/30"
                    />
                  ))}

                {isEmpty && (
                  <div className="rounded-2xl border border-dashed border-primary/30 bg-input/10 p-8 text-center">
                    <p className="text-base font-semibold text-foreground">No rides found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your ride history will appear here once you create or complete rides.
                    </p>
                  </div>
                )}

                {!showInitialSkeleton &&
                  ridesToRender.map((ride) => (
                    <RideHistoryCard
                      key={ride.id}
                      ride={ride}
                      onCancel={openCancelDialog}
                      isCancelling={
                        cancelMutation.isPending && cancelMutation.variables?.rideId === ride.id
                      }
                    />
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Section>
    </>
  );
}
