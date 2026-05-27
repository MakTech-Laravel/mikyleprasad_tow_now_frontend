import { useEffect, useState } from 'react';

/** True after `delayMs` while `active` remains true; false immediately when `active` is false. */
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setFired(true);
    }, delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setFired(false);
    };
  }, [active, delayMs]);

  return active && fired;
}
