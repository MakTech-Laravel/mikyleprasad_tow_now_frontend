import { api } from '@/api/client';
import { unwrapLaravelData } from '@/api/laravelResponse';
import type { Driver } from '@/features/townow-flow/types';
import { getNetworkCache, setNetworkCache } from '@/lib/networkCache';
import { parseLaravelPaginatedResponse } from '@/lib/pagination/parseLaravelPaginated';
import type { PaginatedChunk } from '@/lib/pagination/types';

/** Matches `DriverService::paginate()` public tabs (see FindDriversRequest). */
export type DriversListTab = 'all' | 'featured_drivers';

export type FetchDriversPageParams = {
  page: number;
  pageSize: number;
  signal: AbortSignal;
  q?: string;
  status?: 'Online' | 'Offline';
  tab?: DriversListTab;
};

export type DriversPageChunk = PaginatedChunk<Driver> & { total: number | null; fromCache?: boolean };

const DRIVERS_LIST_SEED_KEY = 'tow-drivers-seed';

export function getDriversListSeed(): string {
  if (typeof sessionStorage === 'undefined') {
    return String(Date.now());
  }

  let seed = sessionStorage.getItem(DRIVERS_LIST_SEED_KEY);
  if (!seed) {
    seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(DRIVERS_LIST_SEED_KEY, seed);
  }

  return seed;
}

export function isLowBandwidthConnection(): boolean {
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number } })
    .connection;
  return (
    conn?.effectiveType === 'slow-2g' ||
    conn?.effectiveType === '2g' ||
    (typeof conn?.downlink === 'number' && conn.downlink > 0 && conn.downlink < 0.5)
  );
}

export function buildDriversCacheKey(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: 'Online' | 'Offline';
  tab?: DriversListTab;
  seed?: string;
}): string {
  const lowBandwidth = isLowBandwidthConnection();
  const paramsForKey = {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q?.trim() || '',
    status: params.status ?? '',
    tab: params.tab ?? '',
    seed: params.seed ?? getDriversListSeed(),
    sort: 'random',
    lite: lowBandwidth ? '1' : '0',
  };
  return `drivers-find:${JSON.stringify(paramsForKey)}`;
}

export function driversCacheTtlMs(): number {
  return isLowBandwidthConnection() ? 10 * 60_000 : 5 * 60_000;
}

export async function fetchDriversPage(params: FetchDriversPageParams): Promise<DriversPageChunk> {
  const { page, pageSize, signal, q, status, tab } = params;
  const seed = getDriversListSeed();
  const cacheKey = buildDriversCacheKey({ page, pageSize, q, status, tab, seed });

  try {
    const response = await api.get('/drivers/find', {
      signal,
      params: {
        page,
        per_page: pageSize,
        q: q?.trim() || undefined,
        status,
        tab,
        sort: 'random',
        seed,
        lite: isLowBandwidthConnection() ? 1 : undefined,
      },
    });

    const chunk = parseLaravelPaginatedResponse<Driver>(response.data);
    if (!chunk) {
      throw new Error('Could not parse driver pagination response.');
    }

    const result = {
      ...chunk,
      total: extractDriversTotalCount(response.data),
    };
    await setNetworkCache(cacheKey, result, driversCacheTtlMs());
    return result;
  } catch (error) {
    const cached = await getNetworkCache<DriversPageChunk>(cacheKey);
    if (cached) return { ...cached, fromCache: true };
    throw error;
  }
}

export function extractDriversTotalCount(body: unknown): number | null {
  let root = body as unknown;
  if (
    !root ||
    typeof root !== 'object' ||
    !('meta' in (root as Record<string, unknown>))
  ) {
    root = (unwrapLaravelData(body) ?? body) as unknown;
  }

  if (!root || typeof root !== 'object') return null;

  const meta = (root as Record<string, unknown>).meta;
  if (!meta || typeof meta !== 'object') return null;

  const total = Number((meta as Record<string, unknown>).total);
  return Number.isFinite(total) ? total : null;
}
