import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/useAuth';
import { hasAnyRole } from '@/auth/roles';
import Loading from '@/components/loading';

export function RoleGate({
  allow,
  fallback,
  unauthenticatedTo = '/login',
  children,
}: {
  allow: string | string[];
  fallback?: string;
  unauthenticatedTo?: string;
  children: React.ReactNode;
}) {
  const { sessionStatus, user } = useAuth();
  const location = useLocation();

  if (sessionStatus === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        <Loading />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    if (unauthenticatedTo === location.pathname) {
      return (
        <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
          <Loading />
        </div>
      );
    }
    return <Navigate to={unauthenticatedTo} replace state={{ from: location }} />;
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        <Loading />
      </div>
    );
  }

  if (!hasAnyRole(user, allow)) {
    const resolvedFallback = fallback ?? '/unauthorized';
    if (resolvedFallback === location.pathname) {
      return <Navigate to="/unauthorized" replace />;
    }
    return <Navigate to={resolvedFallback} replace />;
  }

  return children;
}
