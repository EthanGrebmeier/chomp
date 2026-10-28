import { expect, it, vi } from 'vitest';

import { initializationCache } from '../app/initialization-cache';

it('reuses completed migration checks only for the same user and list', async () => {
  const values = new Map<string, string>();
  const cache = initializationCache({
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
  });
  expect(await cache.has('list', 'user')).toBe(false);
  await cache.mark('list', 'user');
  expect(await cache.has('list', 'user')).toBe(true);
  expect(await cache.has('other-list', 'user')).toBe(false);
  expect(await cache.has('list', 'other-user')).toBe(false);
});

it('falls back to initialization if storage fails', async () => {
  const cache = initializationCache({
    getItem: vi.fn().mockRejectedValue(new Error('disk')),
    setItem: vi.fn().mockRejectedValue(new Error('disk')),
  });
  expect(await cache.has('list', 'user')).toBe(false);
  await expect(cache.mark('list', 'user')).resolves.toBeUndefined();
});
