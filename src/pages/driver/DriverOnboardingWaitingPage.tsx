import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';

import { useAuth } from '@/auth/useAuth';
import { normalizeApprovalStatus } from '@/auth/normalizeApprovalStatus';
import { PageMeta } from '@/components/seo/PageMeta';
import { Button } from '@/components/ui/button';
import Section from '@/components/section';
import { rolePolicy } from '@/auth/rolePolicy';

const POLL_MS = 45_000;

export default function DriverOnboardingWaitingPage() {
  const navigate = useNavigate();
  const { user, logout, refreshSession, isAuthReady } = useAuth();

  const approvalStatus = normalizeApprovalStatus(user?.approval_status) ?? 'pending';
  const isRejected = approvalStatus === 'rejected';

  useEffect(() => {
    if (!isAuthReady || !user || user.role !== 'driver') {
      return;
    }

    const status = normalizeApprovalStatus(user.approval_status);
    if (status === 'approved') {
      navigate(rolePolicy.driver?.dashboard ?? '/driver-app', { replace: true });
      return;
    }

    const timer = window.setInterval(() => {
      void refreshSession({ silent: true }).then((fresh) => {
        if (fresh?.role === 'driver' && normalizeApprovalStatus(fresh.approval_status) === 'approved') {
          navigate(rolePolicy.driver?.dashboard ?? '/driver-app', { replace: true });
        }
      });
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [isAuthReady, navigate, refreshSession, user]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <>
      <PageMeta
        title="Account under review"
        description="Your driver application is being reviewed by the TowTruckTT team."
        keywords={['driver', 'approval', 'pending']}
      />
      <Section
        applyContainer
        containerClassName="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
          <LoaderCircle className="h-10 w-10 animate-spin text-primary" aria-hidden />
        </div>
        <h1 className="mt-8 font-montserrat text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {isRejected ? 'Application not approved' : 'Your Request is Processing'}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {isRejected
            ? 'Your driver account was not approved. Contact support if you believe this is an error.'
            : 'Waiting for Admin approval.'}
        </p>
        {!isRejected ? (
          <p className="mt-2 text-sm text-muted-foreground">This usually takes less than a minute.</p>
        ) : null}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline" className="min-w-[140px] rounded-xl">
            <Link to="/contact-us">Contact</Link>
          </Button>
          <Button
            type="button"
            variant="default"
            className="min-w-[140px] rounded-xl"
            onClick={() => void handleLogout()}
          >
            Log out
          </Button>
        </div>
      </Section>
    </>
  );
}
