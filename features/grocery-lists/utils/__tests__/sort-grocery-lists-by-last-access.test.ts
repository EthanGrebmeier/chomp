import { describe, expect, it } from 'vitest';

import { sortGroceryListsByLastAccess } from '../sort-grocery-lists-by-last-access';

const list = (
  id: string,
  shares: { user_id: string; lastAccessedAt?: string }[]
) => ({ id, shares });

describe('sortGroceryListsByLastAccess', () => {
  it('orders lists by the current user’s most recent access first', () => {
    const lists = [
      list('a', [{ user_id: 'me', lastAccessedAt: '2026-01-01T00:00:00Z' }]),
      list('b', [{ user_id: 'me', lastAccessedAt: '2026-03-01T00:00:00Z' }]),
      list('c', [{ user_id: 'me', lastAccessedAt: '2026-02-01T00:00:00Z' }]),
    ];

    expect(sortGroceryListsByLastAccess(lists, 'me').map(l => l.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('ignores other collaborators’ access times', () => {
    const lists = [
      list('a', [
        { user_id: 'me', lastAccessedAt: '2026-01-01T00:00:00Z' },
        { user_id: 'them', lastAccessedAt: '2026-09-01T00:00:00Z' },
      ]),
      list('b', [{ user_id: 'me', lastAccessedAt: '2026-02-01T00:00:00Z' }]),
    ];

    expect(sortGroceryListsByLastAccess(lists, 'me').map(l => l.id)).toEqual([
      'b',
      'a',
    ]);
  });

  it('places lists the user has never opened at the end, preserving order', () => {
    const lists = [
      list('never-1', [{ user_id: 'me' }]),
      list('opened', [
        { user_id: 'me', lastAccessedAt: '2026-01-01T00:00:00Z' },
      ]),
      list('never-2', []),
    ];

    expect(sortGroceryListsByLastAccess(lists, 'me').map(l => l.id)).toEqual([
      'opened',
      'never-1',
      'never-2',
    ]);
  });

  it('does not mutate the input array', () => {
    const lists = [
      list('a', [{ user_id: 'me', lastAccessedAt: '2026-01-01T00:00:00Z' }]),
      list('b', [{ user_id: 'me', lastAccessedAt: '2026-02-01T00:00:00Z' }]),
    ];

    sortGroceryListsByLastAccess(lists, 'me');

    expect(lists.map(l => l.id)).toEqual(['a', 'b']);
  });
});
