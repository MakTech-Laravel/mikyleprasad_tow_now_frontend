/* ===== FIREBASE-DISABLED START (docs/FIREBASE_DISABLE_AND_RESTORE.md) =====
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { queryClient } from '@/lib/queryClient';

export type TowtrackFcmRideEventDetail = {
  event?: string;
  navigate_to?: string;
  ride_uuid?: string;
  ride_id?: string;
  [key: string]: string | undefined;
};

function invalidateRideQueries(): void {
  void queryClient.invalidateQueries({ queryKey: ['ride-by-id-or-active'] });
  void queryClient.invalidateQueries({ queryKey: ['user', 'rides'] });
  void queryClient.invalidateQueries({ queryKey: ['driver', 'rides'] });
  void queryClient.invalidateQueries({ queryKey: ['driver-incoming-rides'] });
}

export function FcmRideEventBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TowtrackFcmRideEventDetail>).detail;
      if (!detail?.event) {
        return;
      }

      const { event, navigate_to: navigateTo } = detail;

      invalidateRideQueries();

      const openTarget = () => {
        if (navigateTo?.startsWith('/')) {
          navigate(navigateTo);
        }
      };

      switch (event) {
        case 'new_ride_request':
          toast.info('New ride request', {
            action: { label: 'Open', onClick: openTarget },
          });
          break;
        case 'ride_request_sent':
          toast.success('Ride request sent');
          break;
        case 'ride_accepted':
          toast.success('Driver found — ride accepted', {
            action: { label: 'Track', onClick: openTarget },
          });
          break;
        case 'ride_eta_updated':
          toast.info('Driver updated the arrival estimate', {
            action: navigateTo?.startsWith('/') ? { label: 'View', onClick: openTarget } : undefined,
          });
          break;
        case 'driver_arrived':
          toast.info('Driver has arrived', {
            action: { label: 'View', onClick: openTarget },
          });
          break;
        case 'ride_completed':
          toast.success('Ride completed');
          if (navigateTo?.startsWith('/') && navigateTo !== location.pathname + location.search) {
            navigate(navigateTo);
          }
          break;
        case 'ride_cancelled_by_user':
          toast.warning('Customer cancelled the ride');
          break;
        case 'ride_cancelled_by_driver':
          toast.warning('Driver cancelled — we will look for another option', {
            action: { label: 'Rides', onClick: openTarget },
          });
          break;
        case 'no_driver_found':
          toast.error('No driver accepted your request — please try again', {
            action: { label: 'View rides', onClick: openTarget },
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener('towtrack:fcm-ride-event', handler as EventListener);
    return () => window.removeEventListener('towtrack:fcm-ride-event', handler as EventListener);
  }, [navigate, location.pathname, location.search]);

  return null;
}
===== FIREBASE-DISABLED END ===== */

export type TowtrackFcmRideEventDetail = {
  event?: string;
  navigate_to?: string;
  ride_uuid?: string;
  ride_id?: string;
  [key: string]: string | undefined;
};

/** No-op while Firebase FCM is disabled — see docs/FIREBASE_DISABLE_AND_RESTORE.md */
export function FcmRideEventBridge() {
  return null;
}
