import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { hasAnyRole } from '@/auth/roles';
import Loading from '@/components/loading';
import { isDriverBookingExemptPath } from '@/features/rides/rideWorkflow';

/**
 * Keeps authenticated drivers out of the public customer booking shell.
 */
export function DriverBookingBlockGate({ children }: { children: React.ReactNode }) {
  const { sessionStatus, user } = useAuth();
  const location = useLocation();

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        <Loading />
      </div>
    );
  }

  if (
    sessionStatus === 'authenticated' &&
    user &&
    hasAnyRole(user, 'driver') &&
    !isDriverBookingExemptPath(location.pathname)
  ) {
    return <Navigate to="/driver-app" replace state={{ from: location }} />;
  }

  return children;
}
