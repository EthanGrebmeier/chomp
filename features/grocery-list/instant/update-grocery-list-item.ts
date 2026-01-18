import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { GroceryListItem } from '../types';

import { linkStoreToItem } from './link-store-to-item';

export const updateGroceryListItem = async ({
  itemId,
  item,
  currentStoreId,
}: {
  itemId: string;
  item: Partial<GroceryListItem> & { storeId?: string };
  currentStoreId?: string;
}) => {
  const { storeId, ...updateData } = item;

  const transactions = [
    db.tx.grocery_items[itemId].update(
      trimStringFields({
        ...updateData,
        category: item.category ?? null,
      })
    ),
  ];

  // Handle store linking/unlinking separately
  if (storeId !== undefined || currentStoreId) {
    await db.transact(transactions);
    await linkStoreToItem({
      itemId,
      storeId,
      currentStoreId,
    });
  } else {
    await db.transact(transactions);
  }
};
