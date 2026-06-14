import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { rideUiStatus } from '@/api/rides';
import {
  customerWorkflowPath,
  RIDE_WORKFLOW_POLL_MS,
  workflowPathsMatch,
} from '@/features/rides/rideWorkflow';
import { useRideFromUrl } from '@/features/rides/useRideFromUrl';

/**
 * Polls ride status and navigates to the canonical workflow step when it changes.
 */
export function useCustomerRideWorkflowPolling(enabled = true) {
  const navigate = useNavigate();
  const { ride, refetch, isLoading, conversationId } = useRideFromUrl({
    refetchInterval: enabled ? RIDE_WORKFLOW_POLL_MS : false,
  });

  useEffect(() => {
    if (!enabled || !ride || isLoading) return;
  
    const target = customerWorkflowPath(ride);
    if (!target) return;
  
    const current = `${window.location.pathname}${window.location.search}`;
    if (!workflowPathsMatch(current, target)) {
      navigate(target, { replace: true });
    }
  }, [enabled, ride, isLoading]);

  return {
    ride,
    refetch,
    isLoading,
    conversationId,
    uiStatus: ride ? rideUiStatus(ride) : null,
  };
}
