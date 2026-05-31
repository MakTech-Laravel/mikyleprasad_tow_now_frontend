import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';

import { fetchDriverActiveRide } from '@/api/rides';
import { useAuth } from '@/auth/useAuth';
import Loading from '@/components/loading';
import {
  driverActiveRideDetailPath,
  isDriverPathAllowedWhileActiveRideLocked,
} from '@/features/rides/rideWorkflow';

/**
 * When the driver has an in-progress ride, restrict navigation to that job's workflow.
 */
export function DriverActiveRideLockGate({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useAuth();
  const location = useLocation();

  const activeRideQuery = useQuery({
    queryKey: ['driver', 'rides', 'active'],
    queryFn: fetchDriverActiveRide,
    enabled: sessionStatus === 'authenticated',
    staleTime: 0,
  });

  if (sessionStatus === 'loading' || activeRideQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        <Loading />
      </div>
    );
  }

  const ride = activeRideQuery.data ?? null;

  if (!ride) {
    return children;
  }

  if (isDriverPathAllowedWhileActiveRideLocked(location.pathname, ride)) {
    return children;
  }

  const target = driverActiveRideDetailPath(ride);
  if (location.pathname === target) {
    return children;
  }

  return <Navigate to={target} replace state={{ from: location }} />;
}
