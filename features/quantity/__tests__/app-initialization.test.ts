import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), transact: vi.fn(), id: 0 }));
vi.mock('@instantdb/react-native', () => ({
  id: () => `generated-${++mocks.id}`,
}));
vi.mock('@/lib/instant', () => ({
  db: {
    queryOnce: mocks.query,
    transact: mocks.transact,
    tx: new Proxy(
      {},
      {
        get: (_target, entity) =>
          new Proxy(
            {},
            {
              get: (_table, id) => ({
                update: (value: object) => ({
                  link: (links: object) => ({ entity, id, value, links }),
                }),
              }),
            }
          ),
      }
    ),
  },
}));
import { ensureQuantityList } from '../app/initialize';
import { materialize, records, totalFor } from '../model';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.id = 0;
});
it('creates a list-bound guest scope once, preserves scalar totals, and leaves original records untouched', async () => {
  mocks.query
    .mockResolvedValueOnce({ data: { gqc_workspaces_v1: [] } })
    .mockResolvedValueOnce({
      data: {
        grocery_lists: [
          {
            id: 'real-list',
            name: 'Shopping List',
            grocery_items: [
              {
                id: 'old-item',
                name: 'Apples',
                quantity: 2.5,
                unit: 'Each',
                createdAt: '2026-10-19',
                isDeleted: false,
                isChecked: true,
                saved_item: { id: 'saved-apples' },
              },
            ],
            meal_plan_items: [],
            meal_plan_recipes: [],
          },
        ],
      },
    });
  await ensureQuantityList('real-list', 'guest');
  expect(
    mocks.query.mock.calls[0][1].ruleParams.quantityInitialize
  ).toBeTruthy();
  const writes = mocks.transact.mock.calls[0][0];
  expect(writes[0]).toMatchObject({
    entity: 'gqc_workspaces_v1',
    id: 'real-list',
    value: { appListId: 'real-list', ownerId: 'guest', memberIds: ['guest'] },
    links: { groceryList: 'real-list' },
  });
  expect(writes).toHaveLength(2);
  const state = materialize([JSON.parse(writes[1].value.body)]);
  expect(totalFor(state, 'old-item')).toBe(2.5);
  expect(records(state, 'entry')[0]).toMatchObject({
    origin: 'manual',
    sourceId: null,
  });
  expect(records(state, 'row')[0]).toMatchObject({
    status: 'checked',
    unit: 'each',
    savedItemId: 'saved-apples',
  });
  mocks.query
    .mockResolvedValueOnce({
      data: {
        gqc_workspaces_v1: [{ id: 'real-list', appListId: 'real-list' }],
      },
    })
    .mockResolvedValueOnce({
      data: {
        gqc_operations_v1: [{ body: writes[1].value.body }],
        grocery_items: [],
      },
    });
  await ensureQuantityList('real-list', 'guest');
  expect(mocks.transact).toHaveBeenCalledTimes(1);
});
it('rejects an unrelated demo scope instead of importing into it', async () => {
  mocks.query.mockResolvedValue({
    data: { gqc_workspaces_v1: [{ id: 'real-list' }] },
  });
  await expect(ensureQuantityList('real-list', 'guest')).rejects.toThrow(
    'incompatible'
  );
  expect(mocks.transact).not.toHaveBeenCalled();
});

it('restores saved-item links in an earlier development import by row ID', async () => {
  const operation = {
    id: 'old-import',
    label: 'Import',
    parents: [],
    resolves: [],
    guards: [],
    changes: [
      {
        id: 'list',
        before: null,
        value: { kind: 'list', id: 'list', name: 'Groceries' },
      },
      {
        id: 'row',
        before: null,
        value: {
          kind: 'row',
          id: 'row',
          listId: 'list',
          name: 'Milk',
          unit: 'each',
          notes: '',
          category: '',
          store: '',
          status: 'active',
        },
      },
    ],
  };
  mocks.query
    .mockResolvedValueOnce({
      data: { gqc_workspaces_v1: [{ id: 'list', appListId: 'list' }] },
    })
    .mockResolvedValueOnce({
      data: {
        gqc_operations_v1: [{ body: JSON.stringify(operation) }],
        grocery_items: [{ id: 'row', saved_item: { id: 'saved-milk' } }],
      },
    })
    .mockResolvedValueOnce({
      data: {
        gqc_workspaces_v1: [{ id: 'list' }],
        gqc_operations_v1: [
          {
            id: operation.id,
            workspaceId: 'list',
            authorId: 'guest',
            body: JSON.stringify(operation),
          },
        ],
      },
    });
  mocks.transact.mockResolvedValueOnce({ status: 'synced' });
  await ensureQuantityList('list', 'guest');
  const repaired = JSON.parse(mocks.transact.mock.calls[0][0][0].value.body);
  expect(records(materialize([operation, repaired]), 'row')[0]).toMatchObject({
    savedItemId: 'saved-milk',
    name: 'Milk',
  });
  expect(repaired.syncSavedItems).toBeUndefined();
});
