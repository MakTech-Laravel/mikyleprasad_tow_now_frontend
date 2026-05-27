import { describe, expect, it } from 'vitest';

import { dedupeById } from './dedupeById';

type Item = { id: string; label: string };

describe('dedupeById', () => {
  it('removes duplicate ids with last-wins by default', () => {
    const items: Item[] = [
      { id: '1', label: 'cached' },
      { id: '2', label: 'cached-2' },
      { id: '1', label: 'fresh' },
    ];

    expect(dedupeById(items, (item) => item.id)).toEqual([
      { id: '1', label: 'fresh' },
      { id: '2', label: 'cached-2' },
    ]);
  });

  it('keeps first occurrence when strategy is first', () => {
    const items: Item[] = [
      { id: '1', label: 'cached' },
      { id: '1', label: 'fresh' },
    ];

    expect(dedupeById(items, (item) => item.id, { strategy: 'first' })).toEqual([
      { id: '1', label: 'cached' },
    ]);
  });

  it('preserves stable order for unique ids', () => {
    const items: Item[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ];

    expect(dedupeById(items, (item) => item.id)).toEqual(items);
  });

  it('coerces numeric ids to string keys', () => {
    const items = [
      { id: 1, name: 'one' },
      { id: 1, name: 'ONE' },
    ];

    expect(dedupeById(items, (item) => item.id)).toEqual([{ id: 1, name: 'ONE' }]);
  });
});
