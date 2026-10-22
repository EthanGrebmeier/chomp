import { describe, expect, it } from 'vitest';

import { sortGroceryListsByCreatedAt } from '../sort-grocery-lists-by-created-at';

describe('sortGroceryListsByCreatedAt', () => {
  it('orders lists oldest first without mutating the input', () => {
    const lists = [
      { id: 'b', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'c', createdAt: '2026-03-01T00:00:00Z' },
      { id: 'a', createdAt: '2026-01-01T00:00:00Z' },
    ];

    expect(sortGroceryListsByCreatedAt(lists).map(l => l.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(lists.map(l => l.id)).toEqual(['b', 'c', 'a']);
  });
});
