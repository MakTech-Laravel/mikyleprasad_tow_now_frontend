import { Navigate, useLocation } from 'react-router-dom';

import { DRIVER_ONBOARDING_PATH, isDriverAwaitingApproval } from '@/auth/completePassportLogin';
import { useAuth } from '@/auth/useAuth';
import Loading from '@/components/loading';

export function DriverApprovedGate({ children }: { children: React.ReactNode }) {
  const { sessionStatus, user } = useAuth();
  const location = useLocation();

  if (sessionStatus === 'loading' || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        <Loading />
      </div>
    );
  }

  if (isDriverAwaitingApproval(user)) {
    return <Navigate to={DRIVER_ONBOARDING_PATH} replace state={{ from: location }} />;
  }

  return children;
}
