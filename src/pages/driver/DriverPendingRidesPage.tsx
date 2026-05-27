import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { acceptRide, fetchDriverIncomingRides } from '@/api/rides';

export default function DriverPendingRidesPage() {
  const incomingQuery = useQuery({
    queryKey: ['driver-incoming-rides'],
    queryFn: fetchDriverIncomingRides,
  });

  const acceptMutation = useMutation({
    mutationFn: ({ rideId, etaMinutes }: { rideId: number; etaMinutes: number }) =>
      acceptRide(rideId, etaMinutes),
    onSuccess: async () => {
      toast.success('Ride accepted.');
      await incomingQuery.refetch();
    },
    onError: () => toast.error('Could not accept ride.'),
  });

  const rows = incomingQuery.data ?? [];

  return (
    <>
      <PageMeta title="Pending rides" description="Incoming tow requests." keywords={['driver', 'rides']} />
      <div className="space-y-6">
        <h1 className="font-montserrat text-2xl font-semibold tracking-tight">Pending rides</h1>
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>Accept or decline when wired to your API.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.user?.name ?? `User #${j.user?.id ?? '-'}`}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {j.pickup_location} → {j.dropoff_location}
                    </TableCell>
                    <TableCell className="text-sm">{j.notes ?? 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          const raw = window.prompt('Estimated arrival time in minutes:', '15');
                          if (!raw) return;
                          const etaMinutes = Number(raw);
                          if (!Number.isFinite(etaMinutes) || etaMinutes <= 0) {
                            toast.error('Please provide a valid ETA in minutes.');
                            return;
                          }
                          acceptMutation.mutate({ rideId: j.id, etaMinutes });
                        }}
                        disabled={acceptMutation.isPending}
                      >
                        Accept
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!incomingQuery.isLoading && rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No pending requests.</p>
            ) : null}
          </CardContent>
        </Card>
        <p className="text-sm text-muted-foreground">
          See also:{' '}
          <Link to="/driver-app/rides/active" className="font-medium text-primary underline-offset-4 hover:underline">
            When accept request
          </Link>{' '}
          flow in Figma maps to accepting here then opening the active job.
        </p>
      </div>
    </>
  );
}
