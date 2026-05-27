import { unwrapLaravelData } from '@/api/laravelResponse';

import type { PaginatedChunk } from '@/lib/pagination/types';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function readMetaPages(meta: Record<string, unknown>): { current: number; last: number } | null {
  const current = Number(meta.current_page);
  const last = Number(meta.last_page);
  if (!Number.isFinite(current) || !Number.isFinite(last)) return null;
  return { current, last };
}

/**
 * Parses common Laravel JSON pagination shapes (API Resource `data` + `meta`, or classic LengthAwarePaginator).
 * Passport only affects auth headers; the response body still matches your API resource / paginator.
 */
export function parseLaravelPaginatedResponse<T>(body: unknown): PaginatedChunk<T> | null {
  // Keep top-level payload first because Laravel `sendResponse(...)` stores
  // pagination `meta/links` beside `data`, and unwrapping too early loses `meta`.
  if (isRecord(body)) {
    if (Array.isArray(body.data) && isRecord(body.meta)) {
      const pages = readMetaPages(body.meta);
      if (!pages) return null;
      const items = body.data as T[];
      const nextPage = pages.current < pages.last ? pages.current + 1 : null;
      return { items, nextPage };
    }

    if (Array.isArray(body.data) && typeof body.current_page === 'number' && typeof body.last_page === 'number') {
      const items = body.data as T[];
      const current = body.current_page;
      const last = body.last_page;
      const nextPage = current < last ? current + 1 : null;
      return { items, nextPage };
    }
  }

  const once = unwrapLaravelData(body);
  const root = (once !== null && once !== undefined ? once : body) as unknown;

  if (!isRecord(root)) return null;

  // API Resource: { data: T[], meta: { current_page, last_page, ... }, links }
  if (Array.isArray(root.data) && isRecord(root.meta)) {
    const pages = readMetaPages(root.meta);
    if (!pages) return null;
    const items = root.data as T[];
    const nextPage = pages.current < pages.last ? pages.current + 1 : null;
    return { items, nextPage };
  }

  // LengthAwarePaginator at root: { data: T[], current_page, last_page, ... }
  if (Array.isArray(root.data) && typeof root.current_page === 'number' && typeof root.last_page === 'number') {
    const items = root.data as T[];
    const current = root.current_page;
    const last = root.last_page;
    const nextPage = current < last ? current + 1 : null;
    return { items, nextPage };
  }

  // Sometimes still wrapped: { data: { data: [], meta } }
  if (isRecord(root.data) && !Array.isArray(root.data)) {
    return parseLaravelPaginatedResponse<T>(root.data);
  }

  return null;
}
