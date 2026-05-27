import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging';

import { updateFcmToken } from '@/api/rides';

function webFirebaseOptions(): FirebaseOptions {
  const trim = (v: string | undefined) => v?.trim();
  const opts: FirebaseOptions = {
    apiKey: trim(import.meta.env.VITE_FIREBASE_API_KEY) ?? '',
    projectId: trim(import.meta.env.VITE_FIREBASE_PROJECT_ID) ?? '',
    messagingSenderId: trim(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ?? '',
    appId: trim(import.meta.env.VITE_FIREBASE_APP_ID) ?? '',
  };
  const authDomain = trim(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  const storageBucket = trim(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
  const measurementId = trim(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID);
  if (authDomain) opts.authDomain = authDomain;
  if (storageBucket) opts.storageBucket = storageBucket;
  if (measurementId) opts.measurementId = measurementId;
  return opts;
}

export type FcmEnvStatus = {
  hasApiKey: boolean;
  hasVapidKey: boolean;
  hasProjectId: boolean;
  hasAppId: boolean;
  permission: NotificationPermission | 'unsupported';
};

export function isFcmMessagingSupported(): Promise<boolean> {
  return isSupported();
}

/**
 * Read-only snapshot for debug UI (does not request permission).
 */
export function fcmEnvStatus(): FcmEnvStatus {
  const hasApiKey = Boolean((import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim());
  const hasVapidKey = Boolean((import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim());
  const hasProjectId = Boolean((import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim());
  const hasAppId = Boolean((import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim());
  let permission: FcmEnvStatus['permission'] = 'unsupported';
  if (typeof Notification !== 'undefined') {
    permission = Notification.permission;
  }
  return {
    hasApiKey,
    hasVapidKey,
    hasProjectId,
    hasAppId,
    permission,
  };
}

/**
 * Vite PWA does not register a SW in dev; production uses Workbox `sw.js` with Firebase loaded via `importScripts`.
 */
async function messagingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported');
  }
  if (import.meta.env.DEV) {
    return navigator.serviceWorker.register('/firebase-messaging-sw.js');
  }
  return navigator.serviceWorker.ready;
}

/**
 * Request notification permission (if needed), register the messaging service worker, and return an FCM registration token.
 *
 * @throws Error with a short message if prerequisites fail or the token is empty.
 */
export async function requestFcmDeviceToken(): Promise<string> {
  const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim();
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim();
  if (!vapidKey || !apiKey) {
    throw new Error('Missing VITE_FIREBASE_VAPID_KEY or VITE_FIREBASE_API_KEY in environment.');
  }

  const supported = await isSupported();
  if (!supported) {
    throw new Error('Firebase Cloud Messaging is not supported in this browser.');
  }

  const app =
    getApps().length > 0 ? getApps()[0]! : initializeApp(webFirebaseOptions());

  const messaging = getMessaging(app);
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(`Notification permission not granted (got "${permission}").`);
  }

  const serviceWorkerRegistration = await messagingServiceWorkerRegistration();

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration,
  });

  if (!token) {
    throw new Error('getToken() returned an empty string.');
  }

  return token;
}

export async function initFCM(): Promise<void> {
  try {
    const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim();
    const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim();
    if (!vapidKey || !apiKey) {
      return;
    }

    if (!(await isSupported())) {
      return;
    }

    const token = await requestFcmDeviceToken();

    await updateFcmToken(token);
    localStorage.setItem('fcm_token', token);

    const app =
      getApps().length > 0 ? getApps()[0]! : initializeApp(webFirebaseOptions());
    const messaging = getMessaging(app);

    onMessage(messaging, (payload: MessagePayload) => {
      // Let app-level listeners refresh critical data after push delivery.
      window.dispatchEvent(new CustomEvent('towtrack:refresh-data'));

      const data = payload.data;
      const event = data?.event?.trim();
      if (event) {
        window.dispatchEvent(
          new CustomEvent('towtrack:fcm-ride-event', {
            detail: data as Record<string, string>,
          }),
        );
      }
    });
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[fcm] init failed', e);
    }
  }
}
