import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  transact: vi.fn(),
  auth: vi.fn(),
  local: vi.fn(),
}));
vi.mock('@instantdb/react-native', () => ({ id: () => 'query-id' }));
vi.mock('@/features/saved-items/local/upsert-local-saved-item', () => ({
  upsertLocalSavedItem: mocks.local,
}));
vi.mock('@/lib/instant', () => ({
  db: {
    queryOnce: mocks.query,
    transact: mocks.transact,
    getAuth: mocks.auth,
    tx: {
      saved_items: new Proxy(
        {},
        {
          get: (_target, id) =>
            Object.fromEntries(
              ['update', 'link', 'unlink'].map(action => [
                action,
                (value: unknown) => ({ id, action, value }),
              ])
            ),
        }
      ),
    },
  },
}));

import { syncQuantitySavedItems } from '../app/saved-items';
import { materialize } from '../model';
import { checkRow, editShoppingDetails, extraQuantity } from '../shopping';
import type { Operation, ShoppingRow } from '../types';

const row: ShoppingRow = {
  kind: 'row',
  id: 'row',
  listId: 'list',
  name: 'Milk',
  unit: 'each',
  notes: 'Whole milk',
  category: 'Dairy',
  store: 'old-store',
  status: 'active',
  savedItemId: 'saved',
};
const genesis: Operation = {
  id: 'base',
  label: 'Initial',
  parents: [],
  guards: [],
  resolves: [],
  changes: [
    {
      id: 'list',
      before: null,
      value: { kind: 'list', id: 'list', name: 'Groceries' },
    },
    { id: row.id, before: null, value: row },
  ],
};
const edit = (
  details: Parameters<typeof editShoppingDetails>[3],
  opId = 'edit'
) => ({
  ...editShoppingDetails(materialize([genesis]), () => opId, row.id, details),
  syncSavedItems: true,
});
function responses(operations: Operation[], owner = 'me') {
  mocks.query.mockImplementation(async (query: Record<string, unknown>) =>
    'gqc_operations_v1' in query
      ? {
          data: {
            gqc_operations_v1: operations.map(op => ({
              body: JSON.stringify(op),
            })),
          },
        }
      : {
          data: {
            saved_items: [
              {
                id: 'saved',
                name: row.name,
                notes: row.notes,
                category: row.category,
                user: { id: owner },
                store: { id: row.store },
              },
            ],
          },
        }
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ id: 'me' });
  mocks.transact.mockResolvedValue({ status: 'synced' });
});
describe('quantity saved-item synchronization', () => {
  it('syncs only edited metadata and clears the store explicitly', async () => {
    const op = edit({ notes: '2% milk', store: '' });
    responses([genesis, op]);
    await syncQuantitySavedItems(op, 'list');
    expect(mocks.transact).toHaveBeenCalledWith([
      {
        id: 'saved',
        action: 'update',
        value: { notes: '2% milk', updatedAt: expect.any(String) },
      },
      { id: 'saved', action: 'unlink', value: { store: 'old-store' } },
    ]);
  });
  it('does not modify another person’s saved item', async () => {
    const op = edit({ name: 'Oat milk' });
    responses([genesis, op], 'someone-else');
    await syncQuantitySavedItems(op, 'list');
    expect(mocks.transact).not.toHaveBeenCalled();
  });
  it('never syncs a conflicted edit', async () => {
    const winner = edit({ notes: 'Winner' }, 'a');
    const loser = edit({ notes: 'Loser' }, 'z');
    responses([genesis, winner, loser]);
    await syncQuantitySavedItems(loser, 'list');
    expect(mocks.transact).not.toHaveBeenCalled();
  });
  it('uses current metadata when retrying an older accepted edit', async () => {
    const older = edit({ notes: '2% milk' });
    const newer = editShoppingDetails(
      materialize([genesis, older]),
      () => 'newer',
      row.id,
      { notes: 'Skim milk' }
    );
    responses([genesis, older, newer]);
    await syncQuantitySavedItems(older, 'list');
    expect(mocks.transact.mock.calls[0][0][0].value.notes).toBe('Skim milk');
  });
  it('does not sync quantity-only operations', async () => {
    let sequence = 0;
    const op = {
      ...extraQuantity(
        materialize([genesis]),
        () => `extra-${++sequence}`,
        row.id,
        2
      ),
      syncSavedItems: true,
    };
    await syncQuantitySavedItems(op, 'list');
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.transact).not.toHaveBeenCalled();
  });
  it('finishes an accepted metadata edit even if the row was subsequently purchased', async () => {
    const op = edit({ notes: '2% milk' });
    const purchase = checkRow(
      materialize([genesis, op]),
      () => 'purchase',
      row.id
    );
    responses([genesis, op, purchase]);
    await syncQuantitySavedItems(op, 'list');
    expect(mocks.transact.mock.calls[0][0][0].value.notes).toBe('2% milk');
  });
  it('leaves an unsynced saved-item write retryable', async () => {
    const op = edit({ category: 'Drinks' });
    responses([genesis, op]);
    mocks.transact.mockResolvedValue({ status: 'enqueued' });
    await expect(syncQuantitySavedItems(op, 'list')).rejects.toThrow(
      'waiting for a connection'
    );
  });
  it('does not resurrect a deleted saved item', async () => {
    const op = edit({ notes: '2% milk' });
    responses([genesis, op]);
    const query = mocks.query.getMockImplementation()!;
    mocks.query.mockImplementation(async (input, ...args) =>
      'saved_items' in input
        ? { data: { saved_items: [] } }
        : query(input, ...args)
    );
    await syncQuantitySavedItems(op, 'list');
    expect(mocks.transact).not.toHaveBeenCalled();
  });
});
