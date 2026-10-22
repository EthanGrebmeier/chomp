import { describe, expect, it } from 'vitest';

import {
  legacyListAccessTimesFromShares,
  sortGroceryListsByLastAccess,
} from '../sort-grocery-lists-by-last-access';

const list = (id: string) => ({ id });

describe('sortGroceryListsByLastAccess', () => {
  it('orders lists by most recent access first', () => {
    const lists = [list('a'), list('b'), list('c')];
    const accessTimes = {
      a: '2026-01-01T00:00:00Z',
      b: '2026-03-01T00:00:00Z',
      c: '2026-02-01T00:00:00Z',
    };

    expect(
      sortGroceryListsByLastAccess(lists, accessTimes).map(l => l.id)
    ).toEqual(['b', 'c', 'a']);
  });

  it('places lists never opened at the end, preserving order', () => {
    const lists = [list('never-1'), list('opened'), list('never-2')];

    expect(
      sortGroceryListsByLastAccess(lists, {
        opened: '2026-01-01T00:00:00Z',
      }).map(l => l.id)
    ).toEqual(['opened', 'never-1', 'never-2']);
  });

  it('does not mutate the input array', () => {
    const lists = [list('a'), list('b')];

    sortGroceryListsByLastAccess(lists, {
      a: '2026-01-01T00:00:00Z',
      b: '2026-02-01T00:00:00Z',
    });

    expect(lists.map(l => l.id)).toEqual(['a', 'b']);
  });
});

describe('legacyListAccessTimesFromShares', () => {
  it('reads only the current user’s access times', () => {
    const lists = [
      {
        id: 'a',
        shares: [
          { user_id: 'me', lastAccessedAt: '2026-01-01T00:00:00Z' },
          { user_id: 'them', lastAccessedAt: '2026-09-01T00:00:00Z' },
        ],
      },
      { id: 'b', shares: [{ user_id: 'them', lastAccessedAt: '2026-09-01' }] },
      { id: 'c', shares: [{ user_id: 'me' }] },
      { id: 'd' },
    ];

    expect(legacyListAccessTimesFromShares(lists, 'me')).toEqual({
      a: '2026-01-01T00:00:00Z',
    });
  });
});
