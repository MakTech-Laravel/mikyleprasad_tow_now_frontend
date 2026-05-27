import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchPaginatedGet } from '@/lib/pagination/fetchPaginatedGet';

/** Generic row shape for Laravel post index responses; narrow in your UI. */
export type LaravelPostRow = Record<string, unknown> & { id?: number | string };

function postsIndexPath(): string | null {
  const raw = (import.meta.env.VITE_POSTS_INDEX_PATH as string | undefined)?.trim();
  return raw && raw.length > 0 ? raw : null;
}

/**
 * Infinite list backed by `fetchPaginatedGet` + Laravel pagination JSON.
 * Set `VITE_POSTS_INDEX_PATH` (e.g. `/api/posts`) and keep `queryKey` stable when reusing.
 */
export function useLaravelPostsInfinite(pageSize = 15) {
  const path = postsIndexPath();

  return useInfiniteQuery({
    queryKey: ['laravel-posts-infinite', path, pageSize],
    enabled: Boolean(path),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchPaginatedGet<LaravelPostRow>({
        path: path!,
        page: pageParam as number,
        perPage: pageSize,
        signal,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: 30_000,
  });
}
