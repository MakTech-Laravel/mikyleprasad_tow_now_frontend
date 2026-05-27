import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const code = (error as { code?: string } | null)?.code;
        if (code === 'ECONNABORTED' || code === 'ERR_NETWORK') return failureCount < 4;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 15_000),
    },
  },
});
