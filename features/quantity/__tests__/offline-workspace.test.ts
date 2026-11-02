import { beforeEach, expect, it, vi } from 'vitest';

// Exercise the hook's persisted cold-start path without a native renderer.
const harness = vi.hoisted(() => ({
  slots: [] as unknown[],
  cursor: 0,
  effects: [] as (() => unknown)[],
  storage: new Map<string, string>(),
  query: {
    isLoading: false,
    error: undefined as { message: string } | undefined,
    data: { gqc_workspaces_v1: [{ id: 'list' }], gqc_operations_v1: [] },
  },
  queryOnce: vi.fn(),
}));
vi.mock('react', () => ({
  useState: (initial: unknown) => {
    const slot = harness.cursor++;
    if (!(slot in harness.slots))
      harness.slots[slot] = typeof initial === 'function' ? initial() : initial;
    return [
      harness.slots[slot],
      (next: unknown) => {
        harness.slots[slot] =
          typeof next === 'function' ? next(harness.slots[slot]) : next;
      },
    ];
  },
  useRef: (initial: unknown) => {
    const slot = harness.cursor++;
    return harness.slots[slot] ?? (harness.slots[slot] = { current: initial });
  },
  useCallback: (fn: unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
  useEffect: (fn: () => unknown) => harness.effects.push(fn),
}));
vi.mock('@instantdb/react-native', () => ({ id: () => 'id' }));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => harness.storage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      harness.storage.set(key, value);
    },
  },
}));
vi.mock('@/lib/instant', () => ({
  db: {
    useQuery: () => harness.query,
    useConnectionStatus: () => 'closed',
    queryOnce: harness.queryOnce,
  },
}));

import { useQuantityWorkspace } from '../use-quantity-workspace';
import type { Operation } from '../types';

function render(user = 'user') {
  harness.cursor = 0;
  harness.effects = [];
  return useQuantityWorkspace('list', user);
}
async function coldStart(user = 'user') {
  harness.slots = [];
  render(user);
  for (const effect of harness.effects) effect();
  await Promise.resolve();
  return render(user);
}
beforeEach(() => {
  harness.storage.clear();
  harness.query.error = undefined;
  harness.queryOnce.mockReset();
});
it('opens cached lists offline and restores a durable edit after process restart', async () => {
  const session = await coldStart();
  expect(session.canEdit).toBe(true);
  const operation: Operation = {
    id: 'offline',
    label: 'Create list',
    parents: [],
    guards: [],
    resolves: [],
    changes: [
      {
        id: 'list',
        before: null,
        value: { kind: 'list', id: 'list', name: 'Groceries' },
      },
    ],
  };
  await session.send(operation);
  const restored = await coldStart();
  expect(restored.canEdit).toBe(true);
  expect(restored.pending).toEqual([{ operation }]);
  expect(restored.state.documents.list.name).toBe('Groceries');
  expect(harness.queryOnce).not.toHaveBeenCalled();
  expect((await coldStart('other-user')).pending).toEqual([]);
});
it('still blocks editing on permission errors or a corrupt durable outbox', async () => {
  harness.query.error = { message: 'Permission denied' };
  expect((await coldStart()).canEdit).toBe(false);
  harness.query.error = undefined;
  harness.storage.set('quantity-outbox-v1:user:list', 'invalid json');
  expect((await coldStart()).canEdit).toBe(false);
});
