import { mockDelay } from '@/features/infinite-scroll/mockDelay';
import type { Driver } from '@/features/townow-flow/types';
import type { PaginatedChunk } from '@/lib/pagination/types';
import { fetchDrivers } from './data';

export async function fetchMockDriversPage(
  page: number,
  pageSize: number,
  signal: AbortSignal,
): Promise<PaginatedChunk<Driver>> {
  await mockDelay(350, signal);

  if (page < 1) return { items: [], nextPage: null };

  const drivers = await fetchDrivers();
  const totalItems = drivers.length;
  const start = (page - 1) * pageSize;

  if (start >= totalItems) return { items: [], nextPage: null };

  const end = Math.min(start + pageSize, totalItems);
  const items = drivers.slice(start, end);
  const nextPage = end < totalItems ? page + 1 : null;
  return { items, nextPage };
}
