import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';

import { fetchActiveRide } from '@/api/rides';
import { useAuth } from '@/auth/useAuth';
import { hasAnyRole } from '@/auth/roles';
import Loading from '@/components/loading';
import {
  customerWorkflowPath,
  isCustomerRideLocked,
  isDriverBookingExemptPath,
} from '@/features/rides/rideWorkflow';

/**
 * Redirects customers with an open ride away from public booking pages.
 */
export function CustomerPublicRideLockGate({ children }: { children: React.ReactNode }) {
  const { sessionStatus, user } = useAuth();
  const location = useLocation();

  const openRideQuery = useQuery({
    queryKey: ['user', 'rides', 'open'],
    queryFn: fetchActiveRide,
    enabled: sessionStatus === 'authenticated' && Boolean(user) && hasAnyRole(user, 'user'),
    staleTime: 0,
  });

  if (isDriverBookingExemptPath(location.pathname)) {
    return children;
  }

  if (sessionStatus === 'authenticated' && hasAnyRole(user, 'user') && openRideQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        <Loading />
      </div>
    );
  }

  const ride = openRideQuery.data ?? null;

  if (isCustomerRideLocked(ride)) {
    const target = customerWorkflowPath(ride!);
    if (target) {
      return <Navigate to={target} replace state={{ from: location }} />;
    }
  }

  return children;
}
