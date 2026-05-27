import { mockDelay } from '@/features/infinite-scroll/mockDelay';
import type { DemoProduct } from '@/features/infinite-scroll/types';
import type { PaginatedChunk } from '@/lib/pagination/types';

const TOTAL_PAGES = 40;

export async function fetchMockProductsPage(
  page: number,
  pageSize: number,
  signal: AbortSignal,
): Promise<PaginatedChunk<DemoProduct>> {
  await mockDelay(300, signal);
  if (page < 1 || page > TOTAL_PAGES) {
    return { items: [], nextPage: null };
  }

  const start = (page - 1) * pageSize;
  const items: DemoProduct[] = Array.from({ length: pageSize }, (_, i) => {
    const id = start + i + 1;
    const price = (9.99 + (id % 17) * 3.5).toFixed(2);
    return {
      id,
      name: `Catalog item ${id}`,
      priceLabel: `$${price}`,
    };
  });

  const nextPage = page < TOTAL_PAGES ? page + 1 : null;
  return { items, nextPage };
}
