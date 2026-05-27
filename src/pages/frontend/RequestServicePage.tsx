import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, MapPin, Star } from 'lucide-react';
import { AxiosError } from 'axios';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Section from '@/components/section';
import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import InputError from '@/components/input-error';
import Image from '@/components/image';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchDriverById } from '@/api/drivers';
import { createRideRequest } from '@/api/rides';
import { useAuth } from '@/auth/useAuth';
import { hasAnyRole } from '@/auth/roles';
import { bookingQueueAdd } from '@/db/offlineDB';
import { registerBackgroundSync, syncBookings } from '@/services/sync.service';

function rideRequestErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const raw = err.response?.data;
    if (raw && typeof raw === 'object') {
      const msg = (raw as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim()) return msg;
      const errors = (raw as { errors?: unknown }).errors;
      if (errors && typeof errors === 'object' && errors !== null) {
        for (const v of Object.values(errors as Record<string, unknown>)) {
          if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
          if (typeof v === 'string') return v;
        }
      }
    }
    if (typeof err.response?.status === 'number') {
      return `Request failed (${err.response.status}).`;
    }
  }
  return 'Could not submit request. Please try again.';
}

export default function RequestServicePage() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const canSubmit = isAuthenticated && hasAnyRole(user, 'user');

  const driverQuery = useQuery({
    queryKey: ['driver-details-request', driverId],
    queryFn: () => fetchDriverById(driverId!),
    enabled: Boolean(driverId),
  });

  const createRideMutation = useMutation({
    mutationFn: createRideRequest,
    onSuccess: (ride) => {
      toast.success('Request submitted successfully');
      navigate(`/request-waiting?rideId=${ride.id}`);
    },
  });

  const driver = driverQuery.data;

  const formSchema = z.object({
    pickupLocation: z.string().min(3, 'Pickup location is required'),
    dropOffLocation: z.string().min(3, 'Drop-off location is required'),
    additionalNotes: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupLocation: '',
      dropOffLocation: '',
      additionalNotes: '',
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!driverId) {
      toast.error('Driver is not available.');
      return;
    }

    const driverNumericId = Number(driverId);
    if (!Number.isInteger(driverNumericId) || driverNumericId < 1) {
      toast.error('Invalid driver link. Go back to Find Drivers and choose a driver again.');
      return;
    }

    if (!canSubmit) {
      toast.error('Login as a user account to submit a request.');
      navigate('/login');
      return;
    }

    const payload = {
      driver_id: driverNumericId,
      pickup_location: data.pickupLocation,
      dropoff_location: data.dropOffLocation,
      notes: data.additionalNotes,
    };

    const queueOffline = async () => {
      const tempId = await bookingQueueAdd({
        ...payload,
        synced_from_offline: true,
      });
      registerBackgroundSync();
      toast.success('No internet. Request saved on device and will auto-send when online.');
      navigate(`/request-waiting?offlineQueued=1&tempId=${encodeURIComponent(tempId)}`);
    };

    if (!navigator.onLine) {
      void queueOffline();
      return;
    }

    createRideMutation.mutate(payload, {
      onError: async (error) => {
        const code = (error as { code?: string } | null)?.code;
        // Queue only network/timeout failures so user request is not lost.
        if (code === 'ERR_NETWORK' || code === 'ECONNABORTED' || !navigator.onLine) {
          await queueOffline();
          // Try immediate sync in case network returns quickly.
          void syncBookings();
          return;
        }
        toast.error(rideRequestErrorMessage(error));
      },
    });
  };

  return (
    <>
      <PageMeta
        title="Request Service"
        description="Send tow service request details to a driver."
        keywords={['request service', 'tow']}
      />

      <Section applyContainer containerClassName="space-y-6">
        <Button
          onClick={() => navigate(-1)}
          variant="link"
          className="cursor-pointer hover:no-underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to drivers
        </Button>

        <Section.Heading
          title="Request Service"
          subtitle="Fill in the details to send your tow request"
          align="left"
          className="mb-0"
        />

        <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
          <Card className="h-fit rounded-2xl border-border bg-white">
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit as SubmitHandler<z.infer<typeof formSchema>>)}
                className="space-y-4"
              >
                <Field>
                  <FieldLabel>
                    <MapPin className="h-4 w-4 text-muted-foreground" /> Pickup Location
                  </FieldLabel>
                  <FieldContent className="relative">
                    <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      {...register('pickupLocation')}
                      placeholder="Enter pickup address or landmark"
                    />
                  </FieldContent>
                  <InputError message={errors?.pickupLocation?.message} />
                </Field>
                <Field>
                  <FieldLabel>
                    <MapPin className="h-4 w-4 text-muted-foreground" /> Drop-off Location
                  </FieldLabel>
                  <FieldContent className="relative">
                    <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      {...register('dropOffLocation')}
                      placeholder="Enter destination address"
                    />
                  </FieldContent>
                  <InputError message={errors?.dropOffLocation?.message} />
                </Field>
                <Field>
                  <FieldLabel>
                    <FileText className="h-4 w-4 text-muted-foreground" /> Additional Notes
                    (Optional)
                  </FieldLabel>
                  <FieldContent className="relative">
                    <Textarea
                      {...register('additionalNotes')}
                      placeholder="e.g., Vehicle type, special requirements, accessibility info..."
                    />
                  </FieldContent>
                  <InputError message={errors?.additionalNotes?.message} />
                </Field>
                <div className="rounded-xl bg-primary/15 p-3 text-sm text-muted-foreground">
                  Note: The driver will contact you directly to confirm details and discuss pricing.
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createRideMutation.isPending}
                >
                  {createRideMutation.isPending ? 'Sending...' : navigator.onLine ? 'Send Request' : 'Save Offline'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="h-fit rounded-2xl border-border bg-white">
              <CardHeader>
                <CardTitle>Selected Driver</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 font-semibold">
                    {driver?.initials ?? '--'}
                  </div>
                  <div>
                    <p className="font-semibold">{driver?.name ?? 'Loading driver...'}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      {driver?.rating ?? 0} ({driver?.reviews ?? 0} reviews)
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p>Zone: {driver?.location ?? '-'}</p>
                  <p>Status: {driver?.status ?? '-'}</p>
                  <p>Pricing: {driver?.pricing ?? '-'}</p>
                  <p>Response Time: {driver?.responseTime ?? '-'}</p>
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  Contact Driver
                </Button>
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
                  <p>License Plate: {driver?.licensePlate ?? 'N/A'}</p>
                  <p>Max Capacity: {driver?.maxCapacity ?? 'N/A'}</p>
                  <p>Insurance: {driver?.insurance ?? 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {!canSubmit && (
          <p className="rounded-xl border border-input bg-input/40 p-3 text-sm text-muted-foreground">
            You can view this page as guest, but only authenticated user accounts can submit requests.
          </p>
        )}
      </Section>
    </>
  );
}
