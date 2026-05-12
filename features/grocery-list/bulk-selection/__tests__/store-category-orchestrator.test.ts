import { describe, expect, it } from 'vitest';

import {
  buildBulkCategorySelectionPayload,
  buildBulkStoreSelectionPayload,
} from '../store-category-orchestrator';

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
