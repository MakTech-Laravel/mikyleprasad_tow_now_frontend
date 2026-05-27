export type DedupeStrategy = 'first' | 'last';

export function dedupeById<T>(
  items: T[],
  getId: (item: T) => string | number,
  options?: { strategy?: DedupeStrategy },
): T[] {
  const strategy = options?.strategy ?? 'last';
  const seen = new Map<string, T>();

  for (const item of items) {
    const key = String(getId(item));
    if (strategy === 'first' && seen.has(key)) {
      continue;
    }
    seen.set(key, item);
  }

  return Array.from(seen.values());
}
