import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock3, FileText, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { CancelRideDialog } from '@/components/rides/CancelRideDialog';
import { PageMeta } from '@/components/seo/PageMeta';
import { getApiErrorMessage } from '@/lib/error.utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Section from '@/components/section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import { useCustomerRideWorkflowPolling } from '@/features/rides/useCustomerRideWorkflowPolling';
import { cancelRide } from '@/api/rides';

export default function RequestWaitingPage() {
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const offlineQueued = searchParams.get('offlineQueued') === '1';
  const tempId = searchParams.get('tempId');
  const { ride } = useCustomerRideWorkflowPolling();
  const getInitials = useInitials();
  const driver = ride?.driver;

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelRide(ride!.id, reason),
    onSuccess: () => {
      toast.success('Ride request cancelled.');
      navigate('/find-drivers');
    },
    onError: (err) => toast.error(getApiErrorMessage(err) ?? 'Could not cancel request.'),
  });

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
      <PageMeta
        title="Waiting For Driver Response"
        description="Your tow request has been sent to the driver."
        keywords={['request waiting']}
      />

      <Section applyContainer containerClassName="space-y-6 max-w-3xl">
        {/* Status pill */}
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-sm font-medium text-secondary">
            {offlineQueued ? 'REQUEST SAVED OFFLINE' : 'REQUEST SENT'}
          </span>
        </div>

        <Section.Heading
          title="Waiting for Driver Response"
          subtitle="Your request has been sent to the driver"
        />

        <Card className="rounded-2xl border-border p-4 text-left">
          <CardContent className="p-6">
            {/* Driver row */}
            <div className="flex items-center gap-3 border-b border-input pb-4">
              {/* Avatar — fixed size, never shrinks */}
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarImage src="" alt={driver?.name ?? ''} />
                <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-secondary">
                  {getInitials(driver?.name ?? 'DR')}
                </AvatarFallback>
              </Avatar>

              {/* Info — min-w-0 + flex-1 lets it shrink so button is never pushed off */}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-xl font-semibold">{driver?.name ?? 'Loading...'}</p>
                <p className="truncate text-sm font-medium text-muted-foreground">
                  {driver?.address ?? driver?.name ?? 'Driver'} • Average response: 5 min
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                  <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>Reviewing request</span>
                </div>
              </div>

              {/* Message button — shrink-0 keeps it always visible */}
              <Link
                to={
                  ride?.conversation_id
                    ? `/messages/${ride.conversation_id}`
                    : ride
                      ? `/request-accepted?rideId=${ride.id}`
                      : '#'
                }
                className="shrink-0"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer rounded-xl bg-input"
                >
                  <MessageCircle className="size-4" />
                </Button>
              </Link>
            </div>

            {/* Request details */}
            <div className="mt-4 space-y-2 text-sm">
              <h4 className="text-lg font-semibold">Request Details</h4>

              <div className="flex items-start gap-2">
                <MapPin className="mt-1 size-5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-muted">Pickup:</span>
                  <span>{ride?.pickup_location ?? '-'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-1 size-5 shrink-0 text-primary" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-muted">Drop-off:</span>
                  <span>{ride?.dropoff_location ?? '-'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileText className="mt-1 size-5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-muted">Notes:</span>
                  <span>{ride?.notes ?? 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock3 className="mt-1 size-5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-muted">Request Time:</span>
                  <span>{ride?.created_at ? new Date(ride.created_at).toLocaleString() : '-'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info banner */}
        <div className="rounded-xl border border-input bg-input/50 p-4 text-center text-sm font-medium text-muted-foreground">
          {offlineQueued
            ? `No internet currently. Your request is saved on this device${tempId ? ` (${tempId})` : ''} and will be sent automatically when connection returns.`
            : "The driver is reviewing your request. You'll be notified once they respond. This typically takes a few minutes."}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setCancelDialogOpen(true)}
            disabled={!ride || cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Request'}
          </Button>
          <a href={`tel:${driver?.phone ?? ''}`} target="_blank" rel="noopener noreferrer">
            <Button className="cursor-pointer">
              <Phone /> Contact Driver
            </Button>
          </a>
        </div>
      </Section>
    </>
  );
}
