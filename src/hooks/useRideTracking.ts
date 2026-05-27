import { useEcho } from '@/contexts/EchoContext';
import { fetchRideTrack, type RideTrackPayload } from '@/api/rides';
import { subscribeToRide } from '@/services/echoRide';
import { useCallback, useEffect, useRef, useState } from 'react';

type Options = {
  rideId: string | undefined;
  pollIntervalMs?: number;
};

export function useRideTracking({ rideId, pollIntervalMs = 15_000 }: Options) {
  const echo = useEcho();
  const [track, setTrack] = useState<RideTrackPayload | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } })
    .connection;
  const lowBandwidth =
    conn?.effectiveType === 'slow-2g' ||
    conn?.effectiveType === '2g' ||
    (typeof conn?.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.5);
  const effectivePollMs = lowBandwidth ? 20_000 : pollIntervalMs;

  const load = useCallback(async () => {
    if (!rideId) return;
    const t = await fetchRideTrack(rideId);
    setTrack(t);
  }, [rideId]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (!rideId) return;

    const startPoll = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        void load();
      }, effectivePollMs);
    };

    const stopPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    // Keep polling in poor networks even when Echo exists (WS can be unstable on 2G).
    if (!echo || lowBandwidth) {
      startPoll();

      return () => stopPoll();
    }

    stopPoll();

    const sub = subscribeToRide(echo, rideId, {
      onDriverLocation: () => {
        void load();
      },
      onStatusChange: () => {
        void load();
      },
    });

    return () => {
      sub.unsubscribe();
      stopPoll();
    };
  }, [echo, rideId, load, effectivePollMs, lowBandwidth]);

  useEffect(() => {
    const onOff = () => {
      if (!navigator.onLine) return;
      void load();
    };
    window.addEventListener('online', onOff);

    return () => window.removeEventListener('online', onOff);
  }, [load]);

  return { track, reload: load };
}
