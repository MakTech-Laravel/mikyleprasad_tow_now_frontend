import { useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { CancelRideDialog } from '@/components/rides/CancelRideDialog';
import { getApiErrorMessage } from '@/lib/error.utils';

import { PageMeta } from '@/components/seo/PageMeta';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Section from '@/components/section';
import {
  approveRideCompletion,
  cancelRide,
  completeRideAsUser,
  fetchRideById,
  isRideCancelableByUser,
  markRideArrivedAsUser,
  normalizeRideStatus,
  ridePickupArrived,
  rideUiStatus,
  rideUiStatusLabel,
  type RideUiStatus,
} from '@/api/rides';
import { portalQueryKeys } from '@/api/portalQueryKeys';

const STATUS_STYLES: Record<RideUiStatus, string> = {
  pending: 'bg-orange-100 text-orange-600',
  active: 'bg-primary/20 text-primary',
  arrived: 'bg-amber-100 text-amber-800',
  picked_up: 'bg-sky-100 text-sky-800',
  awaiting_confirmation: 'bg-violet-100 text-violet-800',
  completed: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-500',
  expired: 'bg-red-100 text-red-500',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function UserRideDetailPage() {
  const { rideId } = useParams();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const rideQuery = useQuery({
    queryKey: portalQueryKeys.userRides({ detail: rideId }),
    queryFn: () => fetchRideById(rideId!),
    enabled: Boolean(rideId),
  });
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelRide(rideId!, reason),
    onSuccess: async () => {
      toast.success('Ride cancelled.');
      await queryClient.invalidateQueries({ queryKey: portalQueryKeys.userDashboard });
      await rideQuery.refetch();
    },
    onError: (err) => toast.error(getApiErrorMessage(err) ?? 'Could not cancel ride.'),
  });
  const arrivedMutation = useMutation({
    mutationFn: () => markRideArrivedAsUser(rideId!),
    onSuccess: async () => {
      toast.success('Ride marked as arrived.');
      await queryClient.invalidateQueries({ queryKey: portalQueryKeys.userDashboard });
      await queryClient.invalidateQueries({ queryKey: ['ride-by-id-or-active'] });
      await queryClient.invalidateQueries({ queryKey: ['user', 'rides'] });
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.userRides({ detail: rideId }),
      });
      await rideQuery.refetch();
    },
    onError: (error) => {
      console.error('Could not mark ride as arrived.');
      console.error(error);
      toast.error('Could not mark ride as arrived.');
    },
  });
  const completeMutation = useMutation({
    mutationFn: () => completeRideAsUser(rideId!),
    onSuccess: async () => {
      toast.success('Ride completed.');
      await queryClient.invalidateQueries({ queryKey: portalQueryKeys.userDashboard });
      await queryClient.invalidateQueries({ queryKey: ['ride-by-id-or-active'] });
      await queryClient.invalidateQueries({ queryKey: ['user', 'rides'] });
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.userRides({ detail: rideId }),
      });
      await rideQuery.refetch();
    },
    onError: () => toast.error('Could not complete ride.'),
  });
  const approveMutation = useMutation({
    mutationFn: () => approveRideCompletion(rideId!),
    onSuccess: async () => {
      toast.success('Completion confirmed.');
      await queryClient.invalidateQueries({ queryKey: portalQueryKeys.userDashboard });
      await queryClient.invalidateQueries({ queryKey: ['ride-by-id-or-active'] });
      await queryClient.invalidateQueries({ queryKey: ['user', 'rides'] });
      await queryClient.invalidateQueries({
        queryKey: portalQueryKeys.userRides({ detail: rideId }),
      });
      await rideQuery.refetch();
    },
    onError: () => toast.error('Could not confirm completion.'),
  });
  const ride = rideQuery.data;

  if (rideQuery.isLoading) {
    return (
      <Section className="p-0">
        <div className="h-96 animate-pulse rounded-2xl border bg-input/20" />
      </Section>
    );
  }

  if (!ride) {
    return (
      <>
        <PageMeta title="Ride not found" description="This ride does not exist." />
        <Section className="p-0">
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Ride not found</CardTitle>
              <CardDescription>Check your history for valid ride IDs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/rides">Back to ride history</Link>
              </Button>
            </CardContent>
          </Card>
        </Section>
      </>
    );
  }

  const title = 'Ride Details';
  const coarseStatus = normalizeRideStatus(ride.status);
  const uiStatus = rideUiStatus(ride);

  const showMessageLink =
    Boolean(ride.conversation_id) && coarseStatus !== 'cancelled' && uiStatus !== 'cancelled';

  const showCancelRequestButton = isRideCancelableByUser(uiStatus);

  const showTrackSecondary =
    uiStatus === 'pending' ||
    uiStatus === 'active' ||
    uiStatus === 'arrived' ||
    uiStatus === 'picked_up';

  const showMarkArrived = uiStatus === 'active' && !ridePickupArrived(ride);
  const showMarkComplete =
    (uiStatus === 'arrived' || uiStatus === 'picked_up') && coarseStatus === 'active';
  const showApproveCompletion = uiStatus === 'awaiting_confirmation';
  const canLeaveReview = uiStatus === 'completed' && !ride.review;

  const showPrimaryRow =
    showCancelRequestButton ||
    showMarkArrived ||
    showMarkComplete ||
    showApproveCompletion ||
    canLeaveReview;
  const driverName = ride.driver?.name ?? 'Driver';
  const formattedDate = new Date(ride.created_at ?? new Date().toISOString()).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  );

  return (
    <>
      <CancelRideDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        isPending={cancelMutation.isPending}
        onConfirm={(reason) => cancelMutation.mutate(reason)}
        title="Cancel request"
        description="Your driver will be notified. You may optionally share a reason."
        confirmLabel="Cancel request"
      />
      <PageMeta title={title} description="Ride details and status." keywords={['ride', 'tow']} />
      <Section className="p-0">
        <Link to="/rides" className="mb-4 inline-block w-fit">
          <Button
            variant="link"
            size="sm"
            className="-ml-2 cursor-pointer gap-1 text-muted-foreground hover:no-underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to history
          </Button>
        </Link>

        <Card className="rounded-2xl border-primary/20 bg-input/10">
          <CardHeader className="space-y-5 p-6">
            <CardTitle className="text-lg font-semibold text-secondary">{title}</CardTitle>

            <div className="flex items-center gap-4">
              <Link to={`/driver/${ride.driver?.id}`}>
                <Avatar className="size-12">
                  <AvatarImage src={ride.driver?.avatar_url || undefined} alt={driverName} />
                  <AvatarFallback className="bg-slate-200 text-sm font-semibold text-slate-700">
                    {getInitials(driverName)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link to={`/driver/${ride.driver?.id}`} className="text-lg font-semibold">
                  {driverName}
                </Link>
                <div className="flex items-center gap-4">
                  <a
                    href={`tel:${ride.driver?.phone ?? ''}`}
                    className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-secondary"
                  >
                    <Phone className="size-4" />
                    {ride.driver?.phone ?? 'Contact Driver'}
                  </a>
                  {showMessageLink ? (
                    <Link
                      to={ride.conversation_id ? `/messages/${ride.conversation_id}` : '/messages'}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-secondary"
                    >
                      <MessageCircle className="size-4" />
                      Message Driver
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 pt-0">
            <Separator />
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Pickup Location</p>
                <p className="mt-1 inline-flex items-center gap-2 text-lg">
                  <MapPin className="size-5 text-secondary" />
                  {ride.pickup_location}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drop-off Location</p>
                <p className="mt-1 inline-flex items-center gap-2 text-lg">
                  <MapPin className="size-5 text-primary" />
                  {ride.dropoff_location}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="mt-1 inline-flex items-center gap-2 text-lg">
                  <CalendarDays className="size-5 text-secondary" />
                  {formattedDate}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  className={cn(
                    'mt-2 rounded-full px-4 py-1 text-xs font-medium',
                    STATUS_STYLES[uiStatus],
                  )}
                >
                  {rideUiStatusLabel(uiStatus)}
                </Badge>
              </div>
            </div>

            {ride.notes ? (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm">{ride.notes}</p>
              </div>
            ) : null}

            {showPrimaryRow || showTrackSecondary ? (
              <div className="flex flex-col gap-2 pt-2">
                {showPrimaryRow ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {showCancelRequestButton ? (
                      <Button
                        className="h-9 min-w-[140px] flex-1 cursor-pointer rounded-2xl sm:flex-none"
                        type="button"
                        disabled={cancelMutation.isPending}
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        Cancel Request
                      </Button>
                    ) : null}

                    {showMarkArrived ? (
                      <Button
                        className="h-9 min-w-[140px] flex-1 cursor-pointer rounded-2xl sm:flex-none"
                        type="button"
                        disabled={arrivedMutation.isPending}
                        onClick={() => arrivedMutation.mutate()}
                      >
                        {arrivedMutation.isPending ? 'Updating…' : 'Mark as arrived'}
                      </Button>
                    ) : null}

                    {showMarkComplete ? (
                      <Button
                        className="h-9 min-w-[140px] flex-1 cursor-pointer rounded-2xl sm:flex-none"
                        type="button"
                        disabled={completeMutation.isPending}
                        onClick={() => completeMutation.mutate()}
                      >
                        {completeMutation.isPending ? 'Completing…' : 'Mark as complete'}
                      </Button>
                    ) : null}

                    {showApproveCompletion ? (
                      <Button
                        className="h-9 min-w-[140px] flex-1 cursor-pointer rounded-2xl sm:flex-none"
                        type="button"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate()}
                      >
                        {approveMutation.isPending ? 'Confirming…' : 'Confirm service completion'}
                      </Button>
                    ) : null}

                    {canLeaveReview ? (
                      <Button asChild className="h-9 w-full cursor-pointer rounded-2xl sm:w-auto">
                        <Link
                          to={`/rate-experience/${ride.id}`}
                          state={{ rideId: ride.id, driverName }}
                        >
                          Leave a Review
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {showTrackSecondary ? (
                  <Button
                    asChild
                    variant="outline"
                    className="h-9 w-full cursor-pointer rounded-2xl"
                  >
                    <Link to={`/tracking-service?rideId=${ride.id}`}>Track Service</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}

            {ride.review ? (
              <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm text-muted-foreground">Your Review</h4>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'text-sm',
                          i < ride.review!.rating ? 'text-yellow-500' : 'text-gray-300',
                        )}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {ride.review.body && (
                  <p className="mt-1 inline-flex items-center gap-2 text-lg">{ride.review.body}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Reviewed on {new Date(ride.review.created_at).toLocaleDateString()}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
