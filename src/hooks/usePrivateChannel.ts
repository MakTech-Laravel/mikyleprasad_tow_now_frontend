// src/hooks/usePrivateChannel.ts
import { useEffect, useRef } from 'react';
import { useEcho } from '@/contexts/EchoContext';

export function usePrivateChannel(
  channelName: string | null,
  // Stable reference required — wrap handlers in useCallback at call site
  events: Record<string, (data: unknown) => void>,
) {
  const echo = useEcho(); // ← from context, not singleton
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    // Wait until both echo and channelName are ready
    if (!echo || !channelName) return;

    const channel = echo.private(channelName);

    for (const [event, handler] of Object.entries(eventsRef.current)) {
      channel.listen(`.${event}`, handler);
    }

    return () => {
      echo.leave(channelName);
    };
  }, [echo, channelName]); // ✅ re-runs when echo instance becomes available
}