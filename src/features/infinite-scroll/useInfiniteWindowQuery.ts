import { useEffect, useState } from 'react';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import { dedupeById } from '@/lib/dedupeById';
import { getNetworkCache } from '@/lib/networkCache';
import type { PaginatedChunk } from '@/lib/pagination/types';

type CachedPage<TItem> = PaginatedChunk<TItem> & { fromCache?: boolean };

export function flattenInfinitePages<T>(
  data: InfiniteData<CachedPage<T>> | undefined,
  getId: (item: T) => string | number,
): T[] {
  if (!data?.pages?.length) return [];
  const flat = data.pages.flatMap((page) => page.items);
  return dedupeById(flat, getId, { strategy: 'last' });
}

export function infinitePagesFromCache<T>(
  data: InfiniteData<CachedPage<T>> | undefined,
): boolean {
  return (data?.pages ?? []).some((page) => page.fromCache === true);
}

type HydrationState<TPage> = {
  cacheKey: string;
  ready: boolean;
  placeholder?: InfiniteData<TPage, number>;
};

export function useInfiniteWindowQuery<TItem, TPage extends CachedPage<TItem> = CachedPage<TItem>>(
  options: {
    queryKey: readonly unknown[];
    fetchPage: (page: number, signal: AbortSignal) => Promise<TPage>;
    networkCacheKey?: string;
    staleTime?: number;
  },
) {
  const { queryKey, fetchPage, networkCacheKey, staleTime = 60_000 } = options;

  const [hydration, setHydration] = useState<HydrationState<TPage>>({
    cacheKey: networkCacheKey ?? '',
    ready: !networkCacheKey,
  });

  useEffect(() => {
    if (!networkCacheKey) return;

    let cancelled = false;
    void getNetworkCache<TPage>(networkCacheKey).then((cached) => {
      if (cancelled) return;
      setHydration({
        cacheKey: networkCacheKey,
        ready: true,
        placeholder: cached
          ? {
              pages: [cached],
              pageParams: [1],
            }
          : undefined,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [networkCacheKey]);

  const hydrated = !networkCacheKey || (hydration.cacheKey === networkCacheKey && hydration.ready);
  const idbPlaceholder =
    networkCacheKey && hydration.cacheKey === networkCacheKey ? hydration.placeholder : undefined;

  return useInfiniteQuery<TPage, Error, InfiniteData<TPage>, readonly unknown[], number>({
    queryKey: [...queryKey],
    enabled: hydrated,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime,
    refetchOnMount: 'always',
    placeholderData: (previous): InfiniteData<TPage, number> | undefined =>
      previous ?? idbPlaceholder,
  });
}
