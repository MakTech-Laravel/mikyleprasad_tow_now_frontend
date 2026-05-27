import { api } from '@/api/client';
import { parseLaravelPaginatedResponse } from '@/lib/pagination/parseLaravelPaginated';
import type { PaginatedChunk } from '@/lib/pagination/types';

export type FetchPaginatedGetOptions = {
  /** Path after `VITE_API_BASE_URL` (e.g. `/api/posts`). */
  path: string;
  page: number;
  perPage?: number;
  signal?: AbortSignal;
  /** Extra query params merged into the request. */
  extraParams?: Record<string, string | number | boolean | undefined>;
};

/**
 * Reusable GET for Laravel-style paginated JSON. Uses the shared `api` axios instance
 * (Bearer / cookies / refresh) so Passport-protected routes work the same as the rest of the app.
 */
export async function fetchPaginatedGet<T>(options: FetchPaginatedGetOptions): Promise<PaginatedChunk<T>> {
  const { path, page, perPage = 15, signal, extraParams } = options;
  const params: Record<string, string | number | boolean> = {
    page,
    per_page: perPage,
  };
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      if (v !== undefined) params[k] = v;
    }
  }
  const res = await api.get(path, { params, signal });
  const chunk = parseLaravelPaginatedResponse<T>(res.data);
  if (!chunk) {
    throw new Error(`Could not parse paginated response for ${path}`);
  }
  return chunk;
}
