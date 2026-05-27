import { Link, useNavigate } from 'react-router-dom';
import { Check, Clock3, MapPin, MessageCircle, Phone } from 'lucide-react';

import { PageMeta } from '@/components/seo/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { liveUpdates, trackingSteps } from '@/features/townow-flow/data';
import Section from '@/components/section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/useInitials';
import Image from '@/components/image';
import { useRideFromUrl } from '@/features/rides/useRideFromUrl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  completeRideAsUser,
  markRideArrivedAsUser,
  ridePickupArrived,
  rideUiStatus,
  rideUiStatusLabel,
} from '@/api/rides';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { toast } from 'sonner';

export default function TrackingServicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { ride, conversationId, refetch: refetchRide } = useRideFromUrl();
  const driver = ride?.driver;
  const getInitials = useInitials();
  const pickupDone = ride ? ridePickupArrived(ride) : false;

  const arrivedMutation = useMutation({
    mutationFn: () => markRideArrivedAsUser(ride!.id),
    onSuccess: async () => {
      toast.success('Ride marked as arrived.');
      await queryClient.invalidateQueries({ queryKey: portalQueryKeys.userDashboard });
      await queryClient.invalidateQueries({ queryKey: ['ride-by-id-or-active'] });
      await queryClient.invalidateQueries({ queryKey: ['user', 'rides'] });
      await refetchRide();
    },
    onError: () => toast.error('Could not mark ride as arrived.'),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeRideAsUser(ride!.id),
    onSuccess: async (updatedRide) => {
      toast.success('Ride completed.');
      await queryClient.invalidateQueries({ queryKey: portalQueryKeys.userDashboard });
      await queryClient.invalidateQueries({ queryKey: ['ride-by-id-or-active'] });
      await queryClient.invalidateQueries({ queryKey: ['user', 'rides'] });
      navigate(`/service-completed?rideId=${updatedRide.id}`);
    },
  });

  return (
    <>
      <PageMeta
        title="Tracking Your Service"
        description="Track your driver status in real-time."
        keywords={['tracking service']}
      />

      <Section applyContainer>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">Request ID: #{ride?.id ?? '-'}</p>
          {ride ? (
            <Badge variant="outline" className="text-xs font-medium">
              {rideUiStatusLabel(rideUiStatus(ride))}
            </Badge>
          ) : null}
        </div>
        <Section.Heading title="Tracking Your Service" className="mb-0" align="left" />

        <div className="mt-6 space-y-4">
          {/* ── Progress Stepper ── */}
          <Card className="rounded-2xl border-input">
            <CardContent className="p-7">
              <div className="flex items-center justify-between">
                {trackingSteps.map((step, index) => (
                  <>
                    {/* Step bubble + label */}
                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                          step.status === 'done'
                            ? 'bg-[#E8A020] text-white'
                            : step.status === 'active'
                              ? 'bg-[#2D4A5A] text-white'
                              : 'bg-[#EDE9D8] text-[#8a8070]'
                        }`}
                      >
                        {step.status === 'done' ? (
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <p
                        className={`text-center text-xs ${
                          step.status === 'active'
                            ? 'font-bold text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>

                    {/* Connector line between steps */}
                    {index < trackingSteps.length - 1 && (
                      <div
                        className={`mb-5 h-0.5 flex-1 ${
                          step.status === 'done' ? 'bg-[#E8A020]' : 'bg-[#EDE9D8]'
                        }`}
                      />
                    )}
                  </>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="col-span-2 space-y-4">
              {/* ── Your Driver ── */}
              <Card className="rounded-2xl border-input">
                <CardContent className="p-6">
                  <p className="mb-3 font-semibold">Your Driver</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" alt={driver?.name ?? ''} />
                        <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
                          {getInitials(driver?.name ?? 'DR')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{driver?.name ?? 'Loading...'}</p>
                        <p className="text-xs text-muted-foreground">{driver?.address ?? '-'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${driver?.phone ?? ''}`}>
                        <Button size="icon" className="cursor-pointer rounded-xl">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </a>
                      <Link to={conversationId ? `/messages/${conversationId}` : '#'}>
                        <Button size="icon" variant="outline" className="cursor-pointer rounded-xl">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Live Updates ── */}
              <Card className="rounded-2xl border-input">
                <CardContent className="p-6">
                  <p className="mb-4 font-semibold">Live Updates</p>

                  {/* Timeline wrapper */}
                  <div className="relative pl-5">
                    {/* Vertical connector line */}
                    <span className="absolute top-2 bottom-2 left-[6px] w-0.5 bg-[#EDE9D8]" />

                    <div className="space-y-5">
                      {liveUpdates.map((item) => (
                        <div key={item.id} className="relative flex flex-col">
                          {/* Timeline dot */}
                          <span
                            className={`absolute top-1.5 -left-5 z-10 h-3.5 w-3.5 rounded-full ${
                              item.active ? 'bg-[#E8A020]' : 'bg-[#2D4A5A]'
                            }`}
                          />
                          <p
                            className={`text-sm ${
                              item.active ? 'font-bold text-[#2D4A5A]' : 'text-foreground'
                            }`}
                          >
                            {item.text}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── Service Details ── */}
              <Card className="rounded-2xl border-input">
                <CardContent className="space-y-2 p-6">
                  <h4 className="text-lg font-semibold">Service Details</h4>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-1 size-5" />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-muted">Pickup:</span>
                      <span>{ride?.pickup_location ?? '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-1 size-5 text-primary" />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-muted">Drop-off:</span>
                      <span>{ride?.dropoff_location ?? '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Right Sidebar ── */}
            <div className="space-y-4">
              <Card className="rounded-2xl border-input bg-input/20">
                <CardContent className="flex flex-col items-center justify-center space-y-2 p-6">
                  <Clock3 className="size-10 text-secondary" />
                  <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                  <p className="text-5xl font-bold">{ride?.eta_minutes ? `${ride.eta_minutes}` : '-'}</p>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-input">
                <CardContent className="p-6">
                  <p className="mb-3 font-semibold">Quick Actions</p>
                  <div className="space-y-2">
                    <a href={`tel:${driver?.phone ?? ''}`} className="block">
                      <Button className="w-full cursor-pointer">
                        <Phone className="size-4" />
                        Call Driver
                      </Button>
                    </a>
                    <Link to={conversationId ? `/messages/${conversationId}` : '#'} className="block">
                      <Button variant="outline" className="w-full cursor-pointer">
                        <MessageCircle className="size-4" />
                        Send Message
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border bg-input/20">
                <CardContent className="p-6">
                  <p className="mb-3 text-center text-xs text-muted-foreground">Service Controls</p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full cursor-pointer">
                      <span className="w-full cursor-pointer text-xs">En Route</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled={!ride || pickupDone || arrivedMutation.isPending}
                      onClick={() => arrivedMutation.mutate()}
                    >
                      <span className="w-full cursor-pointer text-xs">
                        {pickupDone ? 'Arrived' : arrivedMutation.isPending ? 'Updating…' : 'Mark arrived'}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled
                    >
                      <span className="w-full cursor-pointer text-xs">Picked up</span>
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => completeMutation.mutate()}
                      disabled={!ride || !pickupDone || completeMutation.isPending}
                    >
                      <span className="text-xs">Complete Service</span>
                    </Button>
                    {!ride ? null : !pickupDone ? (
                      <p className="text-center text-xs text-muted-foreground">
                        Mark arrived at pickup before you can complete the service.
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card className="h-fit rounded-2xl border-border">
                <CardHeader>
                  <CardTitle>Vehicle Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-16/5 content-center overflow-hidden rounded-xl bg-muted/40">
                    <Image
                      src="/images/vehicle.svg"
                      alt="Vehicle"
                      className="h-full w-full object-cover"
                      fill={true}
                      unoptimized
                    />
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>License Plate: N/A</p>
                    <p>Max Capacity: N/A</p>
                    <p>Insurance: N/A</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
