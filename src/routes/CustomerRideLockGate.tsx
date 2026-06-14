import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';

import { fetchActiveRide } from '@/api/rides';
import { useAuth } from '@/auth/useAuth';
import Loading from '@/components/loading';
import {
  customerWorkflowPath,
  isCustomerPathAllowedWhileLocked,
  isCustomerRideLocked,
  workflowPathsMatch,
} from '@/features/rides/rideWorkflow';

export function CustomerRideLockGate({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useAuth();
  const location = useLocation();

  const openRideQuery = useQuery({
    queryKey: ['user', 'rides', 'open'],
    queryFn: fetchActiveRide,
    enabled: sessionStatus === 'authenticated',
    staleTime: 30_000,
  });

  if (sessionStatus === 'loading' || openRideQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        <Loading />
      </div>
    );
  }

  const ride = openRideQuery.data ?? null;

  if (!isCustomerRideLocked(ride)) {
    return children;
  }

  const canonical = customerWorkflowPath(ride!);
  if (!canonical) {
    return children;
  }

  const current = `${location.pathname}${location.search}`;

  if (!isCustomerPathAllowedWhileLocked(location.pathname, ride!)) {
    return <Navigate to={canonical} replace state={{ from: location }} />;
  }

  if (!workflowPathsMatch(current, canonical)) {
    return <Navigate to={canonical} replace state={{ from: location }} />;
  }

  return children;
}
