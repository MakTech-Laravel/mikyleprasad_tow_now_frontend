/** One page of items plus the next page number, or null when the server has no more pages. */
export type PaginatedChunk<T> = {
  items: T[];
  nextPage: number | null;
};

export type FetchPaginatedPage<T> = (page: number, signal: AbortSignal) => Promise<PaginatedChunk<T>>;
