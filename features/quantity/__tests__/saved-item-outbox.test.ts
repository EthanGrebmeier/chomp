import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), transact: vi.fn() }));
vi.mock('@instantdb/react-native', () => ({ id: () => 'query' }));
vi.mock('@/lib/instant', () => ({
  db: {
    queryOnce: mocks.query,
    transact: mocks.transact,
    tx: {
      gqc_operations_v1: new Proxy(
        {},
        {
          get: () => ({ update: () => ({ link: () => ({}) }) }),
        }
      ),
    },
  },
}));
import { flushOutbox, type Pending } from '../sync-workspace';
import type { Operation } from '../types';

it('retains failed saved-item sync and retries without duplicating the quantity operation', async () => {
  const operation: Operation = {
    id: 'operation',
    label: 'Edit',
    parents: [],
    changes: [],
    guards: [],
    resolves: [],
    syncSavedItems: true,
  };
  let pending: Pending[] = [{ operation }];
  const afterConfirm = vi
    .fn()
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValue(undefined);
  const options = {
    workspaceId: 'list',
    userId: 'owner',
    getPending: () => pending,
    changePending: async (change: (values: Pending[]) => Pending[]) => {
      pending = change(pending);
    },
    confirm: vi.fn(),
    afterConfirm,
  };
  mocks.query.mockResolvedValueOnce({
    data: { gqc_workspaces_v1: [{ id: 'list' }], gqc_operations_v1: [] },
  });
  mocks.transact.mockResolvedValue({ status: 'synced' });
  await flushOutbox(options);
  expect(pending).toHaveLength(1);
  expect(pending[0].error).toBeTruthy();
  pending = [{ operation }];
  mocks.query.mockResolvedValue({
    data: {
      gqc_workspaces_v1: [{ id: 'list' }],
      gqc_operations_v1: [
        {
          id: operation.id,
          serialKey: 'list:1',
          workspaceId: 'list',
          authorId: 'owner',
          body: JSON.stringify({
            ...operation,
            commit: { sequence: 1, parents: [] },
          }),
        },
      ],
    },
  });
  await flushOutbox(options);
  expect(pending).toEqual([]);
  expect(mocks.transact).toHaveBeenCalledTimes(1);
  expect(afterConfirm).toHaveBeenCalledTimes(2);
});
