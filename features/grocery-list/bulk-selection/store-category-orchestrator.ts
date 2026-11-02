import { type GroceryItemWithMealPlanWriteBackLinks } from '../../meal-planner/instant/plan-list-to-meal-plan-write-back';

export type BulkStoreSelectionPayload = {
  selectedItemIds: string[];
  storeId?: string;
  storeName?: string;
};

export type BulkCategorySelectionPayload = {
  selectedItemIds: string[];
  category?: string;
};

export type BulkStoreCategorySelectedItem = {
  id: string;
  name: string;
  unit?: string;
  store?: {
    id?: string;
  } | null;
  recipe?: {
    id?: string;
  } | null;
  saved_item?: {
    id?: string;
    user?: {
      id?: string;
    } | null;
    store?: {
      id?: string;
    } | null;
  } | null;
} & GroceryItemWithMealPlanWriteBackLinks;

type RunBulkStoreUpdateArgs = {
  selectedItemIds: string[];
  selectedItems: BulkStoreCategorySelectedItem[];
  storeId?: string;
};

type RunBulkCategoryUpdateArgs = {
  selectedItemIds: string[];
  selectedItems: BulkStoreCategorySelectedItem[];
  category?: string;
};

export type BulkStoreCategoryWriteResult = {
  updatedItemCount: number;
  skippedItemCount: number;
  failedSavedItemSyncCount: number;
};

const getSelectedItemIds = (selectedItemIds: Set<string>) =>
  Array.from(selectedItemIds);

// Linked items write the bulk change back to their meal plan source in the
// same transaction as the grocery item writes.

export const runBulkStoreUpdate = async ({
  selectedItemIds,
  storeId,
}: RunBulkStoreUpdateArgs): Promise<BulkStoreCategoryWriteResult> => {
  const { bulkQuantityMetadata } =
    await import('@/features/quantity/app/grocery-actions');
  await bulkQuantityMetadata(selectedItemIds, { store: storeId ?? '' });
  return {
    updatedItemCount: selectedItemIds.length,
    skippedItemCount: 0,
    failedSavedItemSyncCount: 0,
  };
};

export const runBulkCategoryUpdate = async ({
  selectedItemIds,
  category,
}: RunBulkCategoryUpdateArgs): Promise<BulkStoreCategoryWriteResult> => {
  const { bulkQuantityMetadata } =
    await import('@/features/quantity/app/grocery-actions');
  await bulkQuantityMetadata(selectedItemIds, { category: category ?? '' });
  return {
    updatedItemCount: selectedItemIds.length,
    skippedItemCount: 0,
    failedSavedItemSyncCount: 0,
  };
};

export const buildBulkStoreSelectionPayload = ({
  selectedItemIds,
  storeId,
  storeName,
}: {
  selectedItemIds: Set<string>;
  storeId?: string;
  storeName?: string;
}): BulkStoreSelectionPayload | null => {
  const itemIds = getSelectedItemIds(selectedItemIds);
  if (itemIds.length === 0) {
    return null;
  }

  return {
    selectedItemIds: itemIds,
    storeId,
    storeName,
  };
};

export const buildBulkCategorySelectionPayload = ({
  selectedItemIds,
  category,
}: {
  selectedItemIds: Set<string>;
  category?: string;
}): BulkCategorySelectionPayload | null => {
  const itemIds = getSelectedItemIds(selectedItemIds);
  if (itemIds.length === 0) {
    return null;
  }

  return {
    selectedItemIds: itemIds,
    category,
  };
};
