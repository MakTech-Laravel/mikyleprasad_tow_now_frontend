import { useEffect, useMemo, useState } from 'react';

type NetInfo = {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
};

function readNetworkState(): NetInfo {
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } })
    .connection;
  return {
    online: navigator.onLine,
    effectiveType: conn?.effectiveType,
    downlink: conn?.downlink,
  };
}

function isPoorConnection(state: NetInfo): boolean {
  if (!state.online) return false;
  if (state.effectiveType === 'slow-2g' || state.effectiveType === '2g') return true;
  return typeof state.downlink === 'number' && state.downlink > 0 && state.downlink < 0.5;
}

export default function ConnectionBanner() {
  const [state, setState] = useState<NetInfo>(() => readNetworkState());

  useEffect(() => {
    const update = () => setState(readNetworkState());
    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    conn?.addEventListener?.('change', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      conn?.removeEventListener?.('change', update);
    };
  }, []);

  const mode = useMemo(() => {
    if (!state.online) return 'offline' as const;
    if (isPoorConnection(state)) return 'slow' as const;
    return 'ok' as const;
  }, [state]);

  if (mode === 'ok') return null;

  return (
    <div
      className={
        mode === 'offline'
          ? 'bg-destructive px-3 py-2 text-center text-xs font-medium text-destructive-foreground'
          : 'bg-amber-100 px-3 py-2 text-center text-xs font-medium text-amber-900'
      }
      role="status"
      aria-live="polite"
    >
      {mode === 'offline'
        ? 'No internet. You can keep using the app; requests will sync when connection returns.'
        : 'Slow connection detected (2G). Retrying requests with low-bandwidth mode.'}
    </div>
  );
}
