import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  chooseItemDestinations,
  registerStoreReviewer,
} from '../app/store-review';
import { StoreReviewCancelledError } from '../store-review-cancelled';

const { inspect, complete, query } = vi.hoisted(() => ({
  inspect: vi.fn(),
  complete: vi.fn(),
  query: vi.fn(),
}));
vi.mock('@instantdb/react-native', () => ({ id: () => 'new-row' }));
vi.mock('@/lib/instant', () => ({ db: { queryOnce: query } }));
vi.mock('../app/session', () => ({ listSession: () => ({ state: {} }) }));
vi.mock('../store-conflicts', () => ({
  inspectStoreConflicts: inspect,
  completeStoreDestinations: complete,
}));
const inspected = {
  conflicts: [{ item: { id: 'incoming' }, rows: [] }],
  destinations: {},
};
let unregister: (() => void) | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  inspect.mockReturnValue(inspected);
  query.mockResolvedValue({
    data: { stores: [{ id: 'store', name: 'Market' }] },
  });
  complete.mockImplementation((_list, _items, destinations) => destinations);
});
afterEach(() => unregister?.());

describe('conflict presenter routing', () => {
  it('uses the originating sheet instead of the global sheet', async () => {
    const global = vi.fn();
    unregister = registerStoreReviewer(global);
    const local = vi.fn().mockResolvedValue({ incoming: {} });
    await expect(chooseItemDestinations('list', [], local)).resolves.toEqual({
      incoming: {},
    });
    expect(local).toHaveBeenCalledWith({
      conflicts: inspected.conflicts,
      stores: { store: 'Market' },
      changed: false,
    });
    expect(global).not.toHaveBeenCalled();
  });
  it('keeps stale-list re-review in the same originating sheet', async () => {
    const fresh = { ...inspected, destinations: { another: {} } };
    inspect
      .mockReturnValueOnce(inspected)
      .mockReturnValueOnce(fresh)
      .mockReturnValue(fresh);
    const local = vi.fn().mockResolvedValue({ incoming: {} });
    await chooseItemDestinations('list', [], local);
    expect(local).toHaveBeenCalledTimes(2);
    expect(local.mock.calls[1][0].changed).toBe(true);
  });
  it('aborts without choosing destinations when the source card is dismissed', async () => {
    const cancel = new StoreReviewCancelledError();
    const local = vi.fn().mockRejectedValue(cancel);
    await expect(chooseItemDestinations('list', [], local)).rejects.toBe(
      cancel
    );
    expect(complete).not.toHaveBeenCalled();
  });
  it('retains the fallback presenter for entry points without an enclosing add sheet', async () => {
    const global = vi.fn().mockResolvedValue({ incoming: {} });
    unregister = registerStoreReviewer(global);
    await chooseItemDestinations('list', []);
    expect(global).toHaveBeenCalledOnce();
  });
});
