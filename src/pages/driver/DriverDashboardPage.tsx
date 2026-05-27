import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleCheckBig,
  Clock4,
  ClockArrowUp,
  MapPin,
  MessageCircle,
  Route,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';

import { CancelRideDialog } from '@/components/rides/CancelRideDialog';
import { PageMeta } from '@/components/seo/PageMeta';
import { getApiErrorMessage } from '@/lib/error.utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Section from '@/components/section';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchDriverDashboard, fetchDriverRides } from '@/api/driverPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { cancelRideAsDriver, rideUiStatus, rideUiStatusLabel } from '@/api/rides';
import { isDriverAwaitingApproval } from '@/auth/completePassportLogin';
import { useAuth } from '@/auth/useAuth';

// ─── Ride request card ────────────────────────────────────────────────────────

type PendingRide = NonNullable<
  ReturnType<typeof useQuery<Awaited<ReturnType<typeof fetchDriverRides>>>>['data']
>['data'][number];

function RideRequestCard({
  ride,
  onReject,
  isRejecting,
}: {
  ride: PendingRide | undefined;
  onReject?: (rideId: number) => void;
  isRejecting?: boolean;
}) {
  // Empty state when no pending ride for this slot
  if (!ride) {
    return (
      <Card className="flex min-h-[320px] flex-col items-center justify-center overflow-hidden border border-black/10">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-input">
            <ClockArrowUp className="size-6 text-muted-foreground/60" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">No pending request</p>
            <p className="text-xs text-muted-foreground">
              New ride requests will appear here when customers reach out.
            </p>
          </div>
          <Link to="/driver-app/bookings">
            <Button size="sm" variant="outline" className="mt-1 cursor-pointer rounded-xl">
              View All Requests
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-black/30">
      {/* Dark header */}
      <CardHeader className="bg-gray-900 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white sm:text-xl">New Ride Request</h3>
          <Badge className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border-2 border-primary bg-white">
            <span className="text-sm font-semibold text-gray-900">10</span>
            <span className="text-xs font-semibold text-gray-900">SEC</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-5 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left col: route */}
          <div>
            <div className="mb-4 flex items-start gap-3">
              {/* Dashed connector */}
              <div className="flex flex-col items-center gap-1 pt-3.5">
                <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                <div className="h-8 w-px border border-dashed border-gray-300" />
                <Badge variant="default" className="h-1.5 w-1.5 rounded-full bg-[#45636E] p-0" />
                <div className="h-8 w-px border border-dashed border-gray-300" />
              </div>

              {/* Addresses */}
              <div className="min-w-0 flex-1 flex flex-col gap-4">
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold tracking-widest text-gray-400">
                    PICKUP LOCATION
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {ride.pickup_location}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-semibold tracking-widest text-gray-400">
                    DROP-OFF LOCATION
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {ride.dropoff_location}
                  </p>
                </div>
              </div>
            </div>

            <hr className="mb-4 border-gray-200" />

            {/* ETA */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-primary/30">
                <Route size={14} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {ride.eta_minutes != null ? `${ride.eta_minutes} min` : '--'}
                </p>
                <p className="text-[10px] font-semibold tracking-widest text-gray-400">
                  ESTIMATED DISTANCE
                </p>
              </div>
            </div>
          </div>

          {/* Right col: requester + notes */}
          <div className="space-y-3">
            {/* Requester */}
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground">
                    REQUESTER
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {ride.user?.name ?? 'No requester'}
                    </p>
                    {/* Message button — inline, no more absolute positioning */}
                    <Link
                      to={`/driver-app/bookings/messages/${ride.conversation_id ?? ''}`}
                      className="shrink-0"
                    >
                      <Badge className="cursor-pointer rounded-lg bg-primary/35 p-2">
                        <MessageCircle size={14} className="text-gray-500" />
                      </Badge>
                    </Link>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} fill="#f59e0b" className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-600">4.9</span>
                    <span className="text-[11px] text-foreground">(240 rides)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-xl bg-[#F4F4F0] px-4 py-3">
              <p className="mb-1 text-[10px] font-semibold tracking-widest text-black">
                DRIVER NOTES
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground italic">
                {ride.notes ?? 'No notes available.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-[1fr_auto] gap-2.5">
          <Link
            to={`/driver-app/rides/detail/${ride.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3.5 text-xs font-bold tracking-widest text-amber-950 transition-colors hover:bg-amber-500"
          >
            <CheckCircle2 size={15} />
            ACCEPT REQUEST
          </Link>
          <Button
            type="button"
            variant="outline"
            disabled={isRejecting}
            className="cursor-pointer rounded-xl border border-gray-200 bg-gray-100 px-4 py-5 text-xs font-bold tracking-widest text-gray-500 transition-colors hover:bg-gray-200"
            onClick={() => onReject?.(ride.id)}
          >
            {isRejecting ? 'Rejecting…' : 'REJECT'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent ride row ──────────────────────────────────────────────────────────

function RecentRideCard({ ride }: { ride: NonNullable<ReturnType<typeof useQuery<Awaited<ReturnType<typeof fetchDriverDashboard>>>>['data']>['recent_rides'][number] }) {
  return (
    <Card className="w-full rounded-xl border-border shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pt-4 pb-1">
        {/* Avatar + name + timestamp */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="user" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-semibold leading-tight text-gray-900">
              {ride.user?.name ?? 'Customer'}
            </CardTitle>
            <div className="mt-0.5 flex items-center gap-1">
              <CalendarClock size={11} className="shrink-0 text-gray-400" />
              <span className="text-[11px] text-gray-400">
                {ride.created_at ? new Date(ride.created_at).toLocaleString() : 'Recently'}
              </span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <Badge className="shrink-0 bg-primary/15">
          <span className="text-xs font-medium text-primary">
            {rideUiStatusLabel(rideUiStatus(ride))}
          </span>
        </Badge>
      </CardHeader>

      <CardContent className="px-4 py-2">
        {/* Route — truncates on narrow screens */}
        <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-gray-600">
          <MapPin size={12} className="shrink-0 text-gray-400" />
          <span className="truncate">{ride.pickup_location}</span>
          <ArrowRight size={12} className="shrink-0 text-gray-400" />
          <span className="truncate">{ride.dropoff_location}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent rides empty state ─────────────────────────────────────────────────

function RecentRidesEmptyState() {
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
        <p className="text-sm font-semibold text-foreground">No recent rides yet</p>
        <p className="text-xs text-muted-foreground">
          Completed and active rides will appear here once you start accepting requests.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DriverDashboardPage() {
  const { user, sessionStatus } = useAuth();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelRideId, setCancelRideId] = useState<number | null>(null);
  const driverQueriesEnabled =
    sessionStatus === 'authenticated' && Boolean(user) && !isDriverAwaitingApproval(user);

  const dashboardQuery = useQuery({
    queryKey: portalQueryKeys.driverDashboard,
    queryFn: fetchDriverDashboard,
    enabled: driverQueriesEnabled,
  });

  const summary = dashboardQuery.data?.summary;
  const recentRides = (dashboardQuery.data?.recent_rides ?? []).slice(0, 3);

  const pendingQuery = useQuery({
    queryKey: portalQueryKeys.driverRides({ tab: 'pending', page: 1 }),
    queryFn: () => fetchDriverRides({ tab: 'pending', page: 1, per_page: 2 }),
    enabled: driverQueriesEnabled,
  });

  const pendingRides = pendingQuery.data?.data ?? [];
  const firstPending = pendingRides[0];
  const secondPending = pendingRides[1];

  const cancelMutation = useMutation({
    mutationFn: ({ rideId, reason }: { rideId: number; reason?: string }) =>
      cancelRideAsDriver(rideId, reason),
    onSuccess: async () => {
      toast.success('Ride rejected.');
      setCancelDialogOpen(false);
      setCancelRideId(null);
      await queryClient.invalidateQueries({ queryKey: ['driver', 'rides'] });
      await queryClient.invalidateQueries({ queryKey: portalQueryKeys.driverDashboard });
    },
    onError: (err) => toast.error(getApiErrorMessage(err) ?? 'Could not reject ride.'),
  });

  const openRejectDialog = (rideId: number) => {
    setCancelRideId(rideId);
    setCancelDialogOpen(true);
  };

  const confirmRejectRide = (reason?: string) => {
    if (cancelRideId == null) return;
    cancelMutation.mutate({ rideId: cancelRideId, reason });
  };

  const statsItems = [
    { label: 'Total Rides', value: summary?.total ?? 0, icon: TrendingUp, bg: 'bg-primary/30' },
    { label: 'Completed', value: summary?.completed ?? 0, icon: CircleCheckBig, bg: 'bg-primary' },
    {
      label: 'Cancelled',
      value: (summary?.cancelled ?? 0) + (summary?.expired ?? 0),
      icon: X,
      bg: 'bg-primary',
    },
    { label: 'Pending', value: summary?.pending ?? 0, icon: Clock4, bg: 'bg-primary' },
  ];

  return (
    <>
      <CancelRideDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setCancelRideId(null);
        }}
        isPending={cancelMutation.isPending}
        onConfirm={confirmRejectRide}
        title="Reject ride request"
        description="The customer will be notified. You may optionally share a reason."
        confirmLabel="Reject request"
      />
      <PageMeta
        title="Driver dashboard"
        description="TowTruckTT driver overview."
        keywords={['driver']}
      />

      <div className="space-y-3">
        {/* ── Online status toggle ─────────────────────────────────────────── */}
        <Section className="flex items-center justify-between gap-4 rounded-xl border border-border p-5">
          <div className="flex min-w-0 flex-row gap-2">
            <div className="mt-2 h-3 w-3 shrink-0 rounded-full bg-[#00C950]" />
            <div className="min-w-0">
              <h1 className="font-montserrat text-base font-semibold tracking-tight sm:text-lg">
                Driver Status
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                You are online and ready to receive requests.
              </p>
            </div>
          </div>
          <Switch className="shrink-0 data-[state=checked]:bg-[#00C950]" id="driver-online-toggle" />
        </Section>

        {/* ── Stats grid — 2 cols on mobile, 4 on sm+ ─────────────────────── */}
        <Section className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {statsItems.map(({ label, value, icon: Icon, bg }) => (
            <Card
              key={label}
              className="flex items-center justify-between border-border px-3 py-4 lg:px-6 lg:py-8"
            >
              <CardHeader className="p-0 pb-2">
                <CardDescription className="text-xs text-muted-foreground sm:text-sm">
                  {label}
                </CardDescription>
                <CardTitle className="font-montserrat text-2xl tabular-nums sm:text-3xl">
                  {value}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Badge variant="default" className={`rounded-lg p-2 sm:p-3 ${bg}`}>
                  <Icon className="size-4 text-muted-foreground sm:size-5" />
                </Badge>
              </CardContent>
            </Card>
          ))}
        </Section>

        {/* ── Recent activity heading ──────────────────────────────────────── */}
        <Section className="m-0 p-0">
          <h2 className="font-inter text-xl font-semibold tracking-tight">Recent Activity</h2>
        </Section>

        {/* ── Pending request cards — 1 col mobile, 2 col md+ ─────────────── */}
        <Section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <RideRequestCard
            ride={firstPending}
            onReject={openRejectDialog}
            isRejecting={
              cancelMutation.isPending && cancelMutation.variables?.rideId === firstPending?.id
            }
          />
          <RideRequestCard
            ride={secondPending}
            onReject={openRejectDialog}
            isRejecting={
              cancelMutation.isPending && cancelMutation.variables?.rideId === secondPending?.id
            }
          />
        </Section>

        {/* ── Recent rides ─────────────────────────────────────────────────── */}
        <Section>
          <div className="flex flex-col gap-3 rounded-xl border border-border p-5 md:p-6">
            <h2 className="pb-4 font-inter text-xl font-semibold tracking-tight">Recent Rides</h2>

            {recentRides.length === 0 ? (
              <RecentRidesEmptyState />
            ) : (
              /* overflow-x-auto so route text never breaks layout on narrow screens */
              <div className="overflow-x-auto">
                <div className="min-w-[480px] space-y-2">
                  {recentRides.map((ride) => (
                    <RecentRideCard key={ride.id} ride={ride} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>
    </>
  );
}