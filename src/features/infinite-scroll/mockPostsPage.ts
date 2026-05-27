import { mockDelay } from '@/features/infinite-scroll/mockDelay';
import type { DemoPost } from '@/features/infinite-scroll/types';
import type { PaginatedChunk } from '@/lib/pagination/types';

const TOTAL_PAGES = 24;

function titleFor(globalIndex: number) {
  return `Post #${globalIndex + 1}`;
}

function excerptFor(globalIndex: number) {
  return `This is placeholder copy for ${titleFor(globalIndex)}. Scroll to load more via the shared infinite-query pattern.`;
}

/** Simulates a slow Laravel page without hitting the network (demo-friendly). */
export async function fetchMockPostsPage(
  page: number,
  pageSize: number,
  signal: AbortSignal,
): Promise<PaginatedChunk<DemoPost>> {
  await mockDelay(350, signal);
  if (page < 1) {
    return { items: [], nextPage: null };
  }
  if (page > TOTAL_PAGES) {
    return { items: [], nextPage: null };
  }

  const start = (page - 1) * pageSize;
  const items: DemoPost[] = Array.from({ length: pageSize }, (_, i) => {
    const globalIndex = start + i;
    return {
      id: globalIndex + 1,
      title: titleFor(globalIndex),
      excerpt: excerptFor(globalIndex),
    };
  });

  const nextPage = page < TOTAL_PAGES ? page + 1 : null;
  return { items, nextPage };
}
