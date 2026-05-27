import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

type EchoInstance = Echo<'pusher'>;

const EchoContext = createContext<EchoInstance | null>(null);

interface EchoProviderProps {
  children: ReactNode;
  token: string | null;
}

export function EchoProvider({ children, token }: EchoProviderProps) {
  const [echo, setEcho] = useState<EchoInstance | null>(null);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setEcho((prev) => {
          prev?.disconnect();
          return null;
        });
      });
      return;
    }

    const instance = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: import.meta.env.VITE_BROADCAST_AUTH_ENDPOINT,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    });

    queueMicrotask(() => {
      setEcho(instance);
    });

    return () => {
      instance.disconnect();
      queueMicrotask(() => {
        setEcho(null);
      });
    };
  }, [token]);

  return <EchoContext.Provider value={echo}>{children}</EchoContext.Provider>;
}

export function useEcho(): EchoInstance | null {
  return useContext(EchoContext);
}
