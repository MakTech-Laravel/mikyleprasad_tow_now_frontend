import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import Loading from '@/components/loading';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useAuth();
  const location = useLocation();

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        <Loading />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
