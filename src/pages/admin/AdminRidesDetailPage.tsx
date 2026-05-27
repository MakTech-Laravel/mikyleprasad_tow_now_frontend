import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Section from '@/components/section';
import { Card } from '@/components/ui/card';
import { Mail, MapPin, Navigation, Clock, CheckCircle, Calendar, Timer } from 'lucide-react';
import { fetchAdminRideById, rideUiStatus, rideUiStatusLabel, type RideUiStatus } from '@/api/rides';
import { portalQueryKeys } from '@/api/portalQueryKeys';

const STATUS: Record<
  RideUiStatus,
  { bg: string; ring: string; dot: string; label: string }
> = {
  pending: { bg: 'bg-yellow-50', ring: 'border-yellow-300', dot: 'bg-yellow-400', label: 'text-yellow-700' },
  active: { bg: 'bg-orange-50', ring: 'border-orange-300', dot: 'bg-orange-400', label: 'text-orange-700' },
  arrived: { bg: 'bg-amber-50', ring: 'border-amber-300', dot: 'bg-amber-500', label: 'text-amber-800' },
  picked_up: { bg: 'bg-sky-50', ring: 'border-sky-300', dot: 'bg-sky-500', label: 'text-sky-800' },
  awaiting_confirmation: {
    bg: 'bg-violet-50',
    ring: 'border-violet-300',
    dot: 'bg-violet-500',
    label: 'text-violet-800',
  },
  completed: { bg: 'bg-green-50', ring: 'border-green-300', dot: 'bg-green-500', label: 'text-green-700' },
  cancelled: { bg: 'bg-red-50', ring: 'border-red-300', dot: 'bg-red-400', label: 'text-red-700' },
  expired: { bg: 'bg-red-50', ring: 'border-red-300', dot: 'bg-red-400', label: 'text-red-700' },
};

function formatDate(value?: string | null) {
  if (!value) return '--';
  return new Date(value).toLocaleString();
}

export default function AdminRidesDetailPage() {
  const { rideId } = useParams();
  const rideQuery = useQuery({
    queryKey: portalQueryKeys.adminRides({ detail: rideId }),
    queryFn: () => fetchAdminRideById(rideId!),
    enabled: Boolean(rideId),
  });

  if (rideQuery.isLoading) {
    return (
      <Section className="p-4 sm:p-6 lg:p-8">
        <div className="h-96 animate-pulse rounded-2xl border bg-input/20" />
      </Section>
    );
  }

  const ride = rideQuery.data;
  if (!ride) {
    return (
      <Section className="p-4 sm:p-6 lg:p-8">
        <Card className="rounded-2xl border border-primary p-5">
          <p className="font-semibold">Ride not found</p>
          <p className="mt-1 text-sm text-muted-foreground">This ride could not be loaded from the API.</p>
        </Card>
      </Section>
    );
  }

  const ui = rideUiStatus(ride);
  const s = STATUS[ui];
  const emails = [
    { label: 'Customer', value: ride.user?.name ?? `User #${ride.user?.id ?? '-'}` },
    { label: 'Driver', value: ride.driver?.name ?? `Driver #${ride.driver?.id ?? '-'}` },
  ];
  const timeline = [
    { label: 'Booking Created', value: formatDate(ride.created_at), icon: Calendar, done: true },
    { label: 'Booking Accepted', value: formatDate(ride.accepted_at), icon: CheckCircle, done: Boolean(ride.accepted_at) },
    { label: 'ETA Updated', value: ride.eta_minutes ? `${ride.eta_minutes} minutes` : '--', icon: Clock, done: Boolean(ride.eta_minutes) },
    { label: 'Completion Requested', value: formatDate(ride.completion_requested_at), icon: Timer, done: Boolean(ride.completion_requested_at) },
    { label: 'Ride Completed', value: formatDate(ride.completed_at), icon: CheckCircle, done: Boolean(ride.completed_at) },
  ];

  return (
    <Section className="p-4 font-sans sm:p-6 lg:p-8">
      <div className="mx-auto space-y-5">
        <Card className="rounded-2xl border border-primary bg-muted/20 p-5">
          <p className="mb-4 text-xs font-semibold tracking-wider uppercase">Ride Overview - #{ride.id}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                Ride Status
              </p>
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 ${s.bg} ${s.ring}`}>
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                <span className={`text-[11px] font-bold tracking-widest uppercase ${s.label}`}>
                  {rideUiStatusLabel(ui)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-primary bg-accent px-4 py-2">
              <Clock size={14} className="text-gray-500" />
              <div>
                <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                  Ride Duration
                </p>
                <p className="mt-0.5 text-sm font-bold text-gray-900">
                  {ride.total_ride_minutes ? `${ride.total_ride_minutes} min` : '--'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-primary bg-muted/20 p-5">
          <p className="mb-4 text-xs font-semibold tracking-wider uppercase">Participants</p>
          <div className="divide-y divide-gray-100">
            {emails.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary bg-secondary-foreground">
                  <Mail size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{label}</p>
                  <p className="mt-0.5 text-sm leading-tight font-bold break-all text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border border-primary bg-muted/20 p-5">
          <p className="mb-4 text-xs font-semibold tracking-wider uppercase">Ride Locations</p>
          <div className="space-y-3">
            {[
              { type: 'pick', label: 'Pick Location', value: ride.pickup_location },
              { type: 'drop', label: 'Drop Location', value: ride.dropoff_location },
            ].map(({ type, label, value }, i) => (
              <div key={type} className="flex items-start gap-3">
                <div className="flex shrink-0 flex-col items-center pt-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    {i === 0 ? <Navigation size={12} /> : <MapPin size={12} />}
                  </div>
                  {i === 0 && <div className="mt-1 h-5 w-px bg-primary" />}
                </div>
                <div className="flex-1 rounded-xl bg-accent p-3">
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{label}</p>
                  <p className="mt-0.5 text-sm leading-snug font-bold text-gray-900">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-2xl border border-primary bg-muted/20 p-5">
          <p className="mb-4 text-xs font-semibold tracking-wider uppercase">Booking Timeline</p>
          <div className="relative pl-6">
            <div className="absolute top-2 bottom-0 left-2 w-px bg-secondary-foreground" />
            <div className="space-y-5">
              {timeline.map(({ label, value, icon: Icon, done }) => (
                <div key={label} className="relative flex items-start gap-4">
                  <div className={`absolute top-2 -left-6 flex h-4 w-4 items-center justify-center rounded-full border-2 ${done ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`} />
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary bg-gray-50">
                      <Icon size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{label}</p>
                      <p className="mt-0.5 text-sm font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}
