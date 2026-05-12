import { db } from '@/lib/instant';

import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { syncSavedItemFromGroceryItem } from '../instant/sync-saved-item-from-grocery-item';

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

const resolveSelectedItemsForWrite = ({
  selectedItemIds,
  selectedItemsMap,
}: {
  selectedItemIds: string[];
  selectedItemsMap: Map<string, BulkStoreCategorySelectedItem>;
}) => {
  let skippedItemCount = 0;
  const matchedItems: BulkStoreCategorySelectedItem[] = [];

  for (const itemId of selectedItemIds) {
    const item = selectedItemsMap.get(itemId);
    if (!item) {
      skippedItemCount += 1;
      continue;
    }
    matchedItems.push(item);
  }

  return {
    matchedItems,
    skippedItemCount,
  };
};

const runBestEffortSavedItemSyncForItems = async ({
  items,
  patch,
}: {
  items: BulkStoreCategorySelectedItem[];
  patch: {
    storeId?: string;
    category?: string;
  };
}) => {
  const syncResults = await Promise.all(
    items.map(item =>
      runBestEffortSavedItemSync({
        item,
        patch,
      })
    )
  );

  return syncResults.reduce(
    (failedCount, succeeded) => (succeeded ? failedCount : failedCount + 1),
    0
  );
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
  const { matchedItems, skippedItemCount } = resolveSelectedItemsForWrite({
    selectedItemIds,
    selectedItemsMap,
  });
  const transactions = [];

  for (const item of matchedItems) {
    const currentStoreId = item.store?.id;
    if (!storeId && currentStoreId) {
      transactions.push(
        db.tx.grocery_items[item.id].unlink({
          store: currentStoreId,
        })
      );
      continue;
    }

    if (storeId !== currentStoreId) {
      if (currentStoreId) {
        transactions.push(
          db.tx.grocery_items[item.id].unlink({
            store: currentStoreId,
          })
        );
      }
      if (storeId) {
        transactions.push(
          db.tx.grocery_items[item.id].link({
            store: storeId,
          })
        );
      }
    }
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  const failedSavedItemSyncCount = await runBestEffortSavedItemSyncForItems({
    items: matchedItems,
    patch,
  });

  return {
    updatedItemCount: matchedItems.length,
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
  const { matchedItems, skippedItemCount } = resolveSelectedItemsForWrite({
    selectedItemIds,
    selectedItemsMap,
  });
  const transactions = matchedItems.map(item =>
    db.tx.grocery_items[item.id].update(
      trimStringFields({
        category: category ?? null,
      })
    )
  );

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  const failedSavedItemSyncCount = await runBestEffortSavedItemSyncForItems({
    items: matchedItems,
    patch,
  });

  return {
    updatedItemCount: matchedItems.length,
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
