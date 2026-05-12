import { syncSavedItemFromGroceryItem } from '../instant/sync-saved-item-from-grocery-item';
import { updateGroceryItemOnly } from '../instant/update-grocery-item-only';

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
  store?: {
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
};

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

const createSelectedItemsMap = (
  selectedItems: BulkStoreCategorySelectedItem[]
) => {
  return new Map(selectedItems.map(item => [item.id, item]));
};

const runBestEffortSavedItemSync = async ({
  item,
  patch,
}: {
  item: BulkStoreCategorySelectedItem;
  patch: {
    storeId?: string;
    category?: string;
  };
}) => {
  const nextSavedItemId = item.saved_item?.id;
  if (!nextSavedItemId) {
    return true;
  }

  try {
    await syncSavedItemFromGroceryItem({
      item: patch,
      nextSavedItemId,
      currentSavedItemOwnerId: item.saved_item?.user?.id,
      savedItemStoreId: item.saved_item?.store?.id,
      currentItemName: item.name,
    });
    return true;
  } catch {
    return false;
  }
};

export const runBulkStoreUpdate = async ({
  selectedItemIds,
  selectedItems,
  storeId,
}: RunBulkStoreUpdateArgs): Promise<BulkStoreCategoryWriteResult> => {
  const selectedItemsMap = createSelectedItemsMap(selectedItems);
  const patch = { storeId };
  let updatedItemCount = 0;
  let skippedItemCount = 0;
  let failedSavedItemSyncCount = 0;

  for (const itemId of selectedItemIds) {
    const item = selectedItemsMap.get(itemId);
    if (!item) {
      skippedItemCount += 1;
      continue;
    }

    await updateGroceryItemOnly({
      itemId: item.id,
      item: patch,
      currentStoreId: item.store?.id,
      currentSavedItemId: item.saved_item?.id,
    });
    updatedItemCount += 1;

    const savedItemSyncSucceeded = await runBestEffortSavedItemSync({
      item,
      patch,
    });
    if (!savedItemSyncSucceeded) {
      failedSavedItemSyncCount += 1;
    }
  }

  return {
    updatedItemCount,
    skippedItemCount,
    failedSavedItemSyncCount,
  };
};

export const runBulkCategoryUpdate = async ({
  selectedItemIds,
  selectedItems,
  category,
}: RunBulkCategoryUpdateArgs): Promise<BulkStoreCategoryWriteResult> => {
  const selectedItemsMap = createSelectedItemsMap(selectedItems);
  const patch = { category };
  let updatedItemCount = 0;
  let skippedItemCount = 0;
  let failedSavedItemSyncCount = 0;

  for (const itemId of selectedItemIds) {
    const item = selectedItemsMap.get(itemId);
    if (!item) {
      skippedItemCount += 1;
      continue;
    }

    await updateGroceryItemOnly({
      itemId: item.id,
      item: patch,
      currentStoreId: item.store?.id,
      currentSavedItemId: item.saved_item?.id,
    });
    updatedItemCount += 1;

    const savedItemSyncSucceeded = await runBestEffortSavedItemSync({
      item,
      patch,
    });
    if (!savedItemSyncSucceeded) {
      failedSavedItemSyncCount += 1;
    }
  }

  return {
    updatedItemCount,
    skippedItemCount,
    failedSavedItemSyncCount,
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
