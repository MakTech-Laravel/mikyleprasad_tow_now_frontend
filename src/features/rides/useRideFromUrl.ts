import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { fetchActiveRide, fetchRideById } from '@/api/rides';
import { useAuth } from '@/auth/useAuth';
import { RIDE_WORKFLOW_POLL_MS } from '@/features/rides/rideWorkflow';

type UseRideFromUrlOptions = {
  /** When set, poll ride status (workflow pages). Defaults to off. */
  refetchInterval?: number | false;
};

export function useRideFromUrl(options: UseRideFromUrlOptions = {}) {
  const [searchParams] = useSearchParams();
  const rideId = searchParams.get('rideId');
  const { sessionStatus, user } = useAuth();
  const queriesEnabled = sessionStatus === 'authenticated' && Boolean(user);
  const pollMs =
    options.refetchInterval === undefined
      ? false
      : options.refetchInterval === false
        ? false
        : options.refetchInterval || RIDE_WORKFLOW_POLL_MS;

  const rideQuery = useQuery({
    queryKey: ['ride-by-id-or-active', rideId],
    queryFn: async () => {
      if (rideId) return fetchRideById(rideId);
      return fetchActiveRide();
    },
    enabled: queriesEnabled,
    refetchInterval: pollMs,
  });

  const conversationId = useMemo(() => {
    const ride = rideQuery.data;
    return ride?.conversation_id ?? null;
  }, [rideQuery.data]);

  return {
    rideId,
    ride: rideQuery.data ?? null,
    conversationId,
    isLoading: rideQuery.isLoading,
    refetch: rideQuery.refetch,
  };
}
