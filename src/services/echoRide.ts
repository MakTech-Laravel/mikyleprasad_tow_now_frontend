import type Echo from 'laravel-echo';

export type DriverLocationPayload = {
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  ts: string;
};

export type RideStatusPayload = {
  ride_id: number;
  status: string;
  ts: string;
  [key: string]: unknown;
};

export function subscribeToRide(
  echo: Echo<'pusher'>,
  rideId: string | number,
  handlers: {
    onDriverLocation?: (payload: DriverLocationPayload) => void;
    onStatusChange?: (payload: RideStatusPayload) => void;
  },
): { unsubscribe: () => void } {
  const channelName = `ride.${rideId}`;
  const channel = echo.private(channelName);

  if (handlers.onDriverLocation) {
    channel.listen('.driver.location', handlers.onDriverLocation);
  }
  if (handlers.onStatusChange) {
    channel.listen('.status.changed', handlers.onStatusChange);
  }

  return {
    unsubscribe: () => {
      echo.leave(channelName);
    },
  };
}
