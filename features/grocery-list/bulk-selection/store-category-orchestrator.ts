export type BulkStoreSelectionPayload = {
  selectedItemIds: string[];
  storeId?: string;
  storeName?: string;
};

export type BulkCategorySelectionPayload = {
  selectedItemIds: string[];
  category?: string;
};

const getSelectedItemIds = (selectedItemIds: Set<string>) =>
  Array.from(selectedItemIds);

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
