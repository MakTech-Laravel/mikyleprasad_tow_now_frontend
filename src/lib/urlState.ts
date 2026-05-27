export function readSearchParam(searchParams: URLSearchParams, key: string, fallback = ''): string {
  return searchParams.get(key)?.trim() || fallback;
}

export function readPositiveIntParam(
  searchParams: URLSearchParams,
  key: string,
  fallback = 1,
): number {
  const value = Number(searchParams.get(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function writeSearchParams(
  searchParams: URLSearchParams,
  updates: Record<string, string | number | null | undefined>,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || String(value).trim() === '') {
      next.delete(key);
      return;
    }
    next.set(key, String(value));
  });
  return next;
}
