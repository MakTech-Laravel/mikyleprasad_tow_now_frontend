import { unwrapLaravelData } from '@/api/laravelResponse';

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type LaravelPaginated<T> = {
  data: T[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    /** First / last index on this page (Laravel LengthAwarePaginator). */
    from?: number | null;
    to?: number | null;
  };
};

export type RideStats = {
  pending: number;
  active: number;
  completed: number;
  cancelled: number;
  expired: number;
  total: number;
};

type TopLevelPaginatedEnvelope<T> = {
  data?: T[];
  meta?: LaravelPaginated<T>['meta'];
};

export function unwrapPaginated<T>(body: unknown): LaravelPaginated<T> {
  const topLevel = body as TopLevelPaginatedEnvelope<T> | null;
  if (Array.isArray(topLevel?.data)) {
    return { data: topLevel.data, meta: topLevel.meta };
  }

  const payload = unwrapLaravelData<LaravelPaginated<T>>(body);
  return payload ?? { data: [] };
}
