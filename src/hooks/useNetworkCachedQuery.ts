import { useEffect, useState } from 'react';
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { getNetworkCache } from '@/lib/networkCache';

type UseNetworkCachedQueryOptions<TData, TError = Error> = {
  queryKey: QueryKey;
  networkCacheKey: string;
  queryFn: (ctx: { signal: AbortSignal }) => Promise<TData>;
  staleTime?: number;
  select?: (data: TData) => TData;
  enabled?: boolean;
} & Pick<UseQueryOptions<TData, TError, TData, QueryKey>, 'retry' | 'refetchOnMount'>;

export type NetworkCachedQueryResult<TData, TError> = UseQueryResult<TData, TError> & {
  /** True only when the API failed and `queryFn` returned IDB data with `fromCache: true`. */
  isOfflineFallback: boolean;
};

function dataFromCache(data: unknown): boolean {
  return (
    data !== null &&
    typeof data === 'object' &&
    'fromCache' in data &&
    (data as { fromCache?: boolean }).fromCache === true
  );
}

type HydrationState<TData> = {
  cacheKey: string;
  ready: boolean;
  seed?: TData;
};

export function useNetworkCachedQuery<TData, TError = Error>(
  options: UseNetworkCachedQueryOptions<TData, TError>,
): NetworkCachedQueryResult<TData, TError> {
  const {
    queryKey,
    networkCacheKey,
    queryFn,
    staleTime = 30_000,
    select,
    enabled = true,
    ...rest
  } = options;

  const [hydration, setHydration] = useState<HydrationState<TData>>({
    cacheKey: networkCacheKey,
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;
    void getNetworkCache<TData>(networkCacheKey).then((cached) => {
      if (cancelled) return;
      setHydration({
        cacheKey: networkCacheKey,
        ready: true,
        seed: cached ?? undefined,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [networkCacheKey]);

  const hydrated = hydration.cacheKey === networkCacheKey && hydration.ready;
  const idbSeed = hydration.cacheKey === networkCacheKey ? hydration.seed : undefined;

  const query = useQuery({
    queryKey,
    enabled: enabled && hydrated,
    staleTime,
    refetchOnMount: 'always',
    placeholderData: (previous) => (previous ?? idbSeed) as typeof previous,
    queryFn: ({ signal }) => queryFn({ signal }),
    select,
    ...rest,
  } satisfies UseQueryOptions<TData, TError, TData, QueryKey>);

  const isOfflineFallback = query.data !== undefined && dataFromCache(query.data);

  return Object.assign(query, {
    isOfflineFallback,
  }) as NetworkCachedQueryResult<TData, TError>;
}
