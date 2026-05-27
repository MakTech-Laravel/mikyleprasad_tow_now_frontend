import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getQueryDisplayState } from '@/lib/queryDisplayState';

import { PageMeta } from '@/components/seo/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDriverRides } from '@/api/driverPortal';
import { portalQueryKeys } from '@/api/portalQueryKeys';
import { rideUiStatus, rideUiStatusLabel } from '@/api/rides';

export default function DriverActiveRidesPage() {
  const ridesQuery = useQuery({
    queryKey: portalQueryKeys.driverRides({ tab: 'active', page: 1 }),
    queryFn: () => fetchDriverRides({ tab: 'active', page: 1, per_page: 20 }),
  });
  const rows = ridesQuery.data?.data ?? [];
  const { showInitialSkeleton } = getQueryDisplayState(ridesQuery, rows.length);

  return (
    <>
      <PageMeta title="Active rides" description="Jobs in progress." keywords={['driver', 'active']} />
      <div className="space-y-6">
        <h1 className="font-montserrat text-2xl font-semibold tracking-tight">Active rides</h1>
        <div className="grid gap-4">
          {showInitialSkeleton ? (
            <Card className="h-32 animate-pulse border-border bg-input/20" />
          ) : null}
          {!showInitialSkeleton
            ? rows.map((ride) => (
            <Card key={ride.id} className="border-border">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{ride.user?.name ?? 'Customer'}</CardTitle>
                  <CardDescription>
                    {ride.pickup_location} &gt; {ride.dropoff_location}
                  </CardDescription>
                </div>
                <Badge className="bg-primary/15 text-primary">{rideUiStatusLabel(rideUiStatus(ride))}</Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to={`/driver-app/rides/detail/${ride.id}`}>See details</Link>
                </Button>
                {ride.conversation_id ? (
                  <Button asChild variant="outline">
                    <Link to={`/driver-app/bookings/messages/${ride.conversation_id}`}>Messages</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
              ))
            : null}
          {!showInitialSkeleton && rows.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No active rides right now.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
