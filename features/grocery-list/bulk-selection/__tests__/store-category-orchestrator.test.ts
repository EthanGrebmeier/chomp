import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildBulkCategorySelectionPayload,
  buildBulkStoreSelectionPayload,
  runBulkCategoryUpdate,
  runBulkStoreUpdate,
} from '../store-category-orchestrator';

const {
  updateGroceryItemOnlyMock,
  syncSavedItemFromGroceryItemMock,
} = vi.hoisted(() => ({
  updateGroceryItemOnlyMock: vi.fn(),
  syncSavedItemFromGroceryItemMock: vi.fn(),
}));

vi.mock('../../instant/update-grocery-item-only', () => ({
  updateGroceryItemOnly: updateGroceryItemOnlyMock,
}));

vi.mock('../../instant/sync-saved-item-from-grocery-item', () => ({
  syncSavedItemFromGroceryItem: syncSavedItemFromGroceryItemMock,
}));

beforeEach(() => {
  updateGroceryItemOnlyMock.mockReset();
  syncSavedItemFromGroceryItemMock.mockReset();
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
      storeName: 'Trader Joe\'s',
    });

    expect(payload).toEqual({
      selectedItemIds: ['item-1', 'item-3'],
      storeId: 'store-5',
      storeName: 'Trader Joe\'s',
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
    updateGroceryItemOnlyMock.mockResolvedValue(undefined);
    syncSavedItemFromGroceryItemMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('permission mismatch'));

    const result = await runBulkStoreUpdate({
      selectedItemIds: ['item-1', 'item-2'],
      selectedItems: [
        {
          id: 'item-1',
          name: 'Milk',
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

    expect(updateGroceryItemOnlyMock).toHaveBeenCalledTimes(2);
    expect(syncSavedItemFromGroceryItemMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      updatedItemCount: 2,
      skippedItemCount: 0,
      failedSavedItemSyncCount: 1,
    });
  });

  it('skips missing selections and syncs category only when linked saved item exists', async () => {
    updateGroceryItemOnlyMock.mockResolvedValue(undefined);
    syncSavedItemFromGroceryItemMock.mockResolvedValue(undefined);

    const result = await runBulkCategoryUpdate({
      selectedItemIds: ['item-1', 'item-2'],
      selectedItems: [
        {
          id: 'item-1',
          name: 'Bananas',
          saved_item: null,
        },
      ],
      category: 'produce',
    });

    expect(updateGroceryItemOnlyMock).toHaveBeenCalledTimes(1);
    expect(syncSavedItemFromGroceryItemMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      updatedItemCount: 1,
      skippedItemCount: 1,
      failedSavedItemSyncCount: 0,
    });
  });
});
