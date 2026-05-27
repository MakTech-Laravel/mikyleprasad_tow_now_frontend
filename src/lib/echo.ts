import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Required: make Pusher available globally for Laravel Echo
window.Pusher = Pusher;

let echoInstance: Echo<'pusher'> | null = null;

export function createEcho(token: string): Echo<'pusher'> {
  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    wsHost: import.meta.env.VITE_PUSHER_HOST || undefined,
    wsPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
    wssPort: import.meta.env.VITE_PUSHER_PORT ?? 443,
    forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],

    // 👇 This is how Passport auth works — Bearer token in the header
    authEndpoint: import.meta.env.VITE_BROADCAST_AUTH_ENDPOINT,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  return echoInstance;
}

export function getEcho(): Echo<'pusher'> | null {
  return echoInstance;
}

export function destroyEcho(): void {
  echoInstance?.disconnect();
  echoInstance = null;
}