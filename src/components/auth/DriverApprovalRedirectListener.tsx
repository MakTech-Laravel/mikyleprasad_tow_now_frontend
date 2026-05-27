import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { DRIVER_ONBOARDING_PATH } from '@/auth/completePassportLogin';
import { onDriverApprovalRequired } from '@/auth/driverApprovalRedirect';

/** Client-side redirect when driver API returns pending/rejected approval (no full page reload). */
export function DriverApprovalRedirectListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return onDriverApprovalRequired(() => {
      if (location.pathname.startsWith(DRIVER_ONBOARDING_PATH)) {
        return;
      }
      navigate(DRIVER_ONBOARDING_PATH, { replace: true });
    });
  }, [location.pathname, navigate]);

  return null;
}
