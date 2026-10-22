import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildBulkCategorySelectionPayload,
  buildBulkStoreSelectionPayload,
  runBulkCategoryUpdate,
  runBulkStoreUpdate,
} from '../store-category-orchestrator';

const {
  dbTransactMock,
  syncSavedItemFromGroceryItemMock,
  syncRecipeIngredientsFromGroceryItemMock,
} = vi.hoisted(() => ({
  dbTransactMock: vi.fn(),
  syncSavedItemFromGroceryItemMock: vi.fn(),
  syncRecipeIngredientsFromGroceryItemMock: vi.fn(),
}));

vi.mock('@/lib/instant', () => ({
  db: {
    transact: dbTransactMock,
    tx: {
      grocery_items: new Proxy(
        {},
        {
          get: (_, itemId: string) => ({
            update: (payload: unknown) => ({
              type: 'update',
              itemId,
              payload,
            }),
            link: (payload: unknown) => ({
              type: 'link',
              itemId,
              payload,
            }),
            unlink: (payload: unknown) => ({
              type: 'unlink',
              itemId,
              payload,
            }),
          }),
        }
      ),
    },
  },
}));

vi.mock('@instantdb/react-native', () => ({
  tx: new Proxy(
    {},
    {
      get: (_, namespace: string) =>
        new Proxy(
          {},
          {
            get: (_target, entityId: string) =>
              Object.fromEntries(
                ['update', 'link', 'unlink'].map(type => [
                  type,
                  (payload: unknown) => ({
                    type,
                    namespace,
                    entityId,
                    payload,
                  }),
                ])
              ),
          }
        ),
    }
  ),
}));

vi.mock('../../instant/sync-saved-item-from-grocery-item', () => ({
  syncSavedItemFromGroceryItem: syncSavedItemFromGroceryItemMock,
}));

vi.mock('../../instant/sync-recipe-ingredients-from-grocery-item', () => ({
  syncRecipeIngredientsFromGroceryItem:
    syncRecipeIngredientsFromGroceryItemMock,
}));

beforeEach(() => {
  dbTransactMock.mockReset();
  syncSavedItemFromGroceryItemMock.mockReset();
  syncRecipeIngredientsFromGroceryItemMock.mockReset();
});

describe('store and category bulk payload builders', () => {
  it('returns null when no items are selected', () => {
    const storePayload = buildBulkStoreSelectionPayload({
      selectedItemIds: new Set<string>(),
      storeId: 'store-1',
      storeName: 'Costco',
    });
    const categoryPayload = buildBulkCategorySelectionPayload({
      selectedItemIds: new Set<string>(),
      category: 'produce',
    });

    expect(storePayload).toBeNull();
    expect(categoryPayload).toBeNull();
  });

  it('builds a store payload for selected items only', () => {
    const payload = buildBulkStoreSelectionPayload({
      selectedItemIds: new Set(['item-1', 'item-3']),
      storeId: 'store-5',
      storeName: "Trader Joe's",
    });

    expect(payload).toEqual({
      selectedItemIds: ['item-1', 'item-3'],
      storeId: 'store-5',
      storeName: "Trader Joe's",
    });
  });

  it('builds a category payload for selected items only', () => {
    const payload = buildBulkCategorySelectionPayload({
      selectedItemIds: new Set(['item-2']),
      category: undefined,
    });

    expect(payload).toEqual({
      selectedItemIds: ['item-2'],
      category: undefined,
    });
  });
});

describe('bulk store/category write adapters', () => {
  it('updates selected grocery items and does best-effort store sync', async () => {
    dbTransactMock.mockResolvedValue(undefined);
    syncSavedItemFromGroceryItemMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('permission mismatch'));
    syncRecipeIngredientsFromGroceryItemMock.mockResolvedValue(undefined);

    const result = await runBulkStoreUpdate({
      selectedItemIds: ['item-1', 'item-2'],
      selectedItems: [
        {
          id: 'item-1',
          name: 'Milk',
          unit: 'each',
          recipe: { id: 'recipe-1' },
          store: { id: 'store-old' },
          saved_item: {
            id: 'saved-1',
            user: { id: 'owner-1' },
            store: { id: 'store-old' },
          },
        },
        {
          id: 'item-2',
          name: 'Eggs',
          unit: 'each',
          recipe: { id: 'recipe-2' },
          store: { id: 'store-old' },
          saved_item: {
            id: 'saved-2',
            user: { id: 'owner-2' },
            store: { id: 'store-old' },
          },
        },
      ],
      storeId: undefined,
    });

    expect(dbTransactMock).toHaveBeenCalledTimes(1);
    expect(syncSavedItemFromGroceryItemMock).toHaveBeenCalledTimes(2);
    expect(syncRecipeIngredientsFromGroceryItemMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      updatedItemCount: 2,
      skippedItemCount: 0,
      failedSavedItemSyncCount: 1,
    });
  });

  it('skips missing selections and syncs category only when linked saved item exists', async () => {
    dbTransactMock.mockResolvedValue(undefined);
    syncSavedItemFromGroceryItemMock.mockResolvedValue(undefined);
    syncRecipeIngredientsFromGroceryItemMock.mockResolvedValue(undefined);

    const result = await runBulkCategoryUpdate({
      selectedItemIds: ['item-1', 'item-2'],
      selectedItems: [
        {
          id: 'item-1',
          name: 'Bananas',
          unit: 'bunch',
          recipe: { id: 'recipe-1' },
          saved_item: null,
        },
      ],
      category: 'produce',
    });

    expect(dbTransactMock).toHaveBeenCalledTimes(1);
    expect(syncSavedItemFromGroceryItemMock).not.toHaveBeenCalled();
    expect(syncRecipeIngredientsFromGroceryItemMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      updatedItemCount: 1,
      skippedItemCount: 1,
      failedSavedItemSyncCount: 0,
    });
  });
});

describe('bulk store/category meal plan write-back', () => {
  it('writes a bulk store change back to linked sources in the same transaction', async () => {
    dbTransactMock.mockResolvedValue(undefined);

    await runBulkStoreUpdate({
      selectedItemIds: ['item-1', 'item-2', 'item-3'],
      selectedItems: [
        {
          id: 'item-1',
          name: 'Basil',
          unit: 'bunch',
          recipe: { id: 'recipe-1' },
          store: { id: 'store-default' },
          meal_plan_ingredient_snapshot: { id: 'snapshot-1', store: null },
        },
        {
          id: 'item-2',
          name: 'Milk',
          unit: 'gallon',
          store: { id: 'store-old' },
          meal_plan_item: {
            id: 'meal-plan-item-1',
            store: { id: 'store-old' },
          },
        },
        {
          id: 'item-3',
          name: 'Eggs',
          unit: 'each',
        },
      ],
      storeId: 'store-new',
    });

    expect(dbTransactMock).toHaveBeenCalledTimes(1);
    const [transactions] = dbTransactMock.mock.calls[0];
    expect(transactions).toEqual(
      expect.arrayContaining([
        {
          type: 'link',
          namespace: 'meal_plan_recipe_ingredient_snapshots',
          entityId: 'snapshot-1',
          payload: { store: 'store-new' },
        },
        {
          type: 'update',
          namespace: 'meal_plan_items',
          entityId: 'meal-plan-item-1',
          payload: { updatedAt: expect.any(String) },
        },
        {
          type: 'unlink',
          namespace: 'meal_plan_items',
          entityId: 'meal-plan-item-1',
          payload: { store: 'store-old' },
        },
        {
          type: 'link',
          namespace: 'meal_plan_items',
          entityId: 'meal-plan-item-1',
          payload: { store: 'store-new' },
        },
      ])
    );
    expect(
      transactions.filter(
        (transaction: { namespace?: string }) => transaction.namespace
      )
    ).toHaveLength(4);
  });

  it('writes a bulk category change back to linked sources', async () => {
    dbTransactMock.mockResolvedValue(undefined);

    await runBulkCategoryUpdate({
      selectedItemIds: ['item-1', 'item-2'],
      selectedItems: [
        {
          id: 'item-1',
          name: 'Basil',
          unit: 'bunch',
          meal_plan_ingredient_snapshot: { id: 'snapshot-1' },
        },
        {
          id: 'item-2',
          name: 'Eggs',
          unit: 'each',
        },
      ],
      category: undefined,
    });

    expect(dbTransactMock).toHaveBeenCalledTimes(1);
    const [transactions] = dbTransactMock.mock.calls[0];
    expect(transactions).toEqual([
      { type: 'update', itemId: 'item-1', payload: { category: null } },
      { type: 'update', itemId: 'item-2', payload: { category: null } },
      {
        type: 'update',
        namespace: 'meal_plan_recipe_ingredient_snapshots',
        entityId: 'snapshot-1',
        payload: { category: null },
      },
    ]);
  });

  it('leaves unlinked items writing only grocery items', async () => {
    dbTransactMock.mockResolvedValue(undefined);

    await runBulkCategoryUpdate({
      selectedItemIds: ['item-1'],
      selectedItems: [{ id: 'item-1', name: 'Eggs', unit: 'each' }],
      category: 'dairy',
    });

    expect(dbTransactMock).toHaveBeenCalledWith([
      { type: 'update', itemId: 'item-1', payload: { category: 'dairy' } },
    ]);
  });
});
