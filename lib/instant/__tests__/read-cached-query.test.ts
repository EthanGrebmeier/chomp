import { afterEach, expect, it, vi } from 'vitest';

const subscribe = vi.hoisted(() => vi.fn());
vi.mock('../index', () => ({ db: { core: { subscribeQuery: subscribe } } }));
import { readCachedQuery } from '../read-cached-query';

afterEach(() => vi.useRealTimers());
it('returns cached data without a network query and cleans up a synchronous subscription', async () => {
  const cleanup = vi.fn();
  subscribe.mockImplementation((_query, callback) => {
    callback({ data: { stores: [{ id: 'store', name: 'Market' }] } });
    return cleanup;
  });
  await expect(readCachedQuery({ stores: {} })).resolves.toEqual({
    data: { stores: [{ id: 'store', name: 'Market' }] },
  });
  expect(cleanup).toHaveBeenCalledOnce();
});
it('bounds a missing cache on a hanging connection and unsubscribes', async () => {
  vi.useFakeTimers();
  const cleanup = vi.fn();
  subscribe.mockReturnValue(cleanup);
  const result = readCachedQuery({ stores: {} });
  const assertion = expect(result).rejects.toThrow('not downloaded');
  await vi.advanceTimersByTimeAsync(3000);
  await assertion;
  expect(cleanup).toHaveBeenCalledOnce();
});
