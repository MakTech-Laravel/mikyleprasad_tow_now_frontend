import { Navigate, useLocation } from 'react-router-dom';

import { getPostAuthPath } from '@/auth/completePassportLogin';
import { hasAnyRole } from '@/auth/roles';
import { useAuth } from '@/auth/useAuth';
import { env } from '@/config/env';
import Loading from '@/components/loading';

/**
 * GuestGate protects guest-only pages (login/fallback pages).
 *
 * Rules:
 * - If not authenticated: render children.
 * - If authenticated with a validated user:
 *   - loginMode=single: redirect to user's recommended dashboard.
 *   - loginMode=multi: redirect only if `roleScope` matches user's role(s); otherwise allow viewing the page.
 */
export function GuestGate({
  roleScope,
  redirectTo,
  children,
}: {
  /** If set, only users with these roles get redirected away in multi-login mode. */
  roleScope?: string | string[];
  /** Optional override for where to send authenticated users. */
  redirectTo?: string;
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

  if (sessionStatus !== 'authenticated' || !user) return children;

  const nextFromQuery = new URLSearchParams(location.search).get('next');
  const fromState = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const recommended =
    redirectTo ?? getPostAuthPath(user, nextFromQuery ?? fromState ?? undefined);

  if (recommended === location.pathname) return children;

  if (env.loginMode === 'single') {
    return <Navigate to={recommended} replace />;
  }

  // multi login mode: only redirect away if this is the user's own role login page
  if (!roleScope) return children;
  if (!hasAnyRole(user, roleScope)) return children;
  return <Navigate to={recommended} replace />;
}
