import { describe, expect, it } from 'vitest';

import type { FrequentItem } from '../../utils/frequent-items';
import {
  getCachedFrequentItems,
  setCachedFrequentItems,
} from '../frequent-items-memory-cache';

const milk: FrequentItem = {
  normalizedName: 'milk',
  name: 'Milk',
  quantity: 1,
  unit: 'gallon',
  count: 3,
  lastAddedAt: '2026-07-15T12:00:00.000Z',
};

describe('frequent items memory cache', () => {
  it('retains the latest result for a list', () => {
    const key = 'user-1:list-1';

    setCachedFrequentItems(key, [milk]);

    expect(getCachedFrequentItems(key)).toEqual([milk]);
  });

  it('distinguishes a cached empty result from a cache miss', () => {
    const key = 'user-1:empty-list';

    setCachedFrequentItems(key, []);

    expect(getCachedFrequentItems(key)).toEqual([]);
    expect(getCachedFrequentItems('user-1:uncached-list')).toBeUndefined();
  });
});
