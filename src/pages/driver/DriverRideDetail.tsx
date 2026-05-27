import { useState } from 'react';
import { ArrowLeft, Clock, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { CancelRideDialog } from '@/components/rides/CancelRideDialog';
import { EstimatedArrivalModal } from '@/components/rides/EstimatedArrivalModal';
import { getApiErrorMessage } from '@/lib/error.utils';
import { PageMeta } from '@/components/seo/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  acceptRide,
  cancelRideAsDriver,
  fetchDriverRideById,
  markRideArrivedAsDriver,
  normalizeRideStatus,
  requestRideCompletionByDriver,
  ridePickupArrived,
  rideUiStatus,
  rideUiStatusLabel,
  updateRideEta,
} from '@/api/rides';
import { portalQueryKeys } from '@/api/portalQueryKeys';

export default function DriverRideDetail() {
  const { rideId } = useParams();
  const queryClient = useQueryClient();
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [etaModalOpen, setEtaModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const rideQuery = useQuery({
    queryKey: portalQueryKeys.driverRides({ detail: rideId }),
    queryFn: () => fetchDriverRideById(rideId!),
    enabled: Boolean(rideId),
  });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['driver', 'rides'] });
    await queryClient.invalidateQueries({ queryKey: portalQueryKeys.driverDashboard });
    await rideQuery.refetch();
  };

  const acceptMutation = useMutation({
    mutationFn: (etaMinutes: number) => acceptRide(rideId!, etaMinutes),
    onSuccess: async () => {
      toast.success('Ride accepted.');
      await refresh();
    },
    onError: () => toast.error('Could not accept ride.'),
  });

  const etaMutation = useMutation({
    mutationFn: (payload: { eta_minutes: number; reason: string }) => updateRideEta(rideId!, payload),
    onSuccess: async () => {
      toast.success('ETA updated.');
      await refresh();
    },
    onError: () => toast.error('Could not update ETA.'),
  });
  const completeMutation = useMutation({
    mutationFn: () => requestRideCompletionByDriver(rideId!),
    onSuccess: async () => {
      toast.success('Completion requested.');
      await refresh();
    },
    onError: () => toast.error('Could not request completion.'),
  });
  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelRideAsDriver(rideId!, reason),
    onSuccess: async () => {
      toast.success('Ride cancelled.');
      await refresh();
    },
    onError: (err) => toast.error(getApiErrorMessage(err) ?? 'Could not cancel ride.'),
  });
  const arrivedMutation = useMutation({
    mutationFn: () => markRideArrivedAsDriver(rideId!),
    onSuccess: async () => {
      toast.success('Pickup marked as arrived.');
      await refresh();
    },
    onError: () => toast.error('Could not mark pickup as arrived.'),
  });

  const ride = rideQuery.data;
  const status = ride ? normalizeRideStatus(ride.status) : 'pending';
  const uiStatus = ride ? rideUiStatus(ride) : 'pending';
  const customerName = ride?.user?.name ?? 'Customer';

  const isTerminal =
    status === 'cancelled' ||
    status === 'expired' ||
    uiStatus === 'cancelled' ||
    uiStatus === 'expired';

  const showMessage = Boolean(ride?.conversation_id && !isTerminal);

  const showDriverCancel =
    uiStatus === 'pending' ||
    uiStatus === 'active' ||
    uiStatus === 'arrived' ||
    uiStatus === 'picked_up';

  const showActivate = uiStatus === 'pending';
  const showUpdateEta = uiStatus === 'active';
  const showMarkArrived = Boolean(ride && uiStatus === 'active' && !ridePickupArrived(ride));
  const showRequestCompletion = Boolean(
    ride &&
      (uiStatus === 'arrived' || uiStatus === 'picked_up') &&
      status === 'active' &&
      ridePickupArrived(ride),
  );
  const showReview = uiStatus === 'completed';

  if (rideQuery.isLoading) {
    return <div className="h-96 animate-pulse rounded-xl border bg-input/20" />;
  }

  if (!ride) {
    return (
      <>
        <PageMeta title="Ride not found" description="Driver ride detail." />
        <Card>
          <CardHeader>
            <CardTitle>Ride not found</CardTitle>
            <CardDescription>This ride could not be loaded from the API.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/driver-app/bookings">Back to bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <EstimatedArrivalModal
        open={acceptModalOpen}
        onOpenChange={setAcceptModalOpen}
        mode="accept"
        isPending={acceptMutation.isPending}
        onConfirm={(minutes) => acceptMutation.mutate(minutes)}
      />
      <EstimatedArrivalModal
        open={etaModalOpen}
        onOpenChange={setEtaModalOpen}
        mode="updateEta"
        isPending={etaMutation.isPending}
        onConfirm={(minutes, reason) => etaMutation.mutate({ eta_minutes: minutes, reason })}
      />
      <CancelRideDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        isPending={cancelMutation.isPending}
        onConfirm={(reason) => cancelMutation.mutate(reason)}
        title="Cancel ride"
        description="The customer will be notified. You may optionally share a reason."
        confirmLabel="Cancel ride"
      />

      <PageMeta title={`Ride - ${customerName}`} description="Driver ride detail." />
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
          <Link to="/driver-app/bookings">
            <ArrowLeft className="h-4 w-4" />
            Bookings
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-montserrat text-2xl font-semibold tracking-tight">{customerName}</h1>
            <p className="text-sm text-muted-foreground">Ride #{ride.id}</p>
          </div>
          <Badge className="text-xs font-medium">{rideUiStatusLabel(uiStatus)}</Badge>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Stops
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Pickup</p>
              <p>{ride.pickup_location}</p>
            </div>
            <Separator />
            <div>
              <p className="text-xs uppercase text-muted-foreground">Drop-off</p>
              <p>{ride.dropoff_location}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">ETA</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4" />
                {ride.eta_minutes ? `${ride.eta_minutes} minutes` : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{ride.notes ?? '-'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button asChild type="button">
            <a href={`tel:${ride.user?.phone ?? ''}`}>
              <Phone className="mr-2 h-4 w-4" />
              Call customer
            </a>
          </Button>
          {showMessage ? (
            <Button asChild variant="outline">
              <Link to={`/driver-app/bookings/messages/${ride.conversation_id}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Open chat
              </Link>
            </Button>
          ) : null}

          {showActivate ? (
            <Button type="button" onClick={() => setAcceptModalOpen(true)} disabled={acceptMutation.isPending}>
              Activate ride
            </Button>
          ) : null}

          {showUpdateEta ? (
            <Button
              variant="secondary"
              type="button"
              disabled={etaMutation.isPending}
              onClick={() => setEtaModalOpen(true)}
            >
              Update ETA
            </Button>
          ) : null}

          {showMarkArrived ? (
            <Button type="button" disabled={arrivedMutation.isPending} onClick={() => arrivedMutation.mutate()}>
              {arrivedMutation.isPending ? 'Updating…' : 'Mark as arrived'}
            </Button>
          ) : null}

          {showRequestCompletion ? (
            <Button
              variant="secondary"
              type="button"
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
            >
              Request completion
            </Button>
          ) : null}

          {showReview ? (
            <Button asChild variant="default">
              <Link to="/driver-app/review" state={{ rideId: ride.id }}>
                Review
              </Link>
            </Button>
          ) : null}

          {showDriverCancel ? (
            <Button
              variant="outline"
              type="button"
              disabled={cancelMutation.isPending}
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancel ride
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
