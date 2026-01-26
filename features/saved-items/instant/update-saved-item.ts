import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { BaseSavedItem } from '../types';

import { linkStoreToSavedItem } from './link-store-to-saved-item';

export type UpdateSavedItemArgs = {
  itemId: string;
  updates: Partial<BaseSavedItem>;
  currentStoreId?: string;
};

export const updateSavedItem = async ({
  itemId,
  updates,
  currentStoreId,
}: UpdateSavedItemArgs) => {
  const { storeId, ...updateData } = updates;

  const transactions = [
    db.tx.saved_items[itemId].update(
      trimStringFields({
        ...updateData,
        category: updates.category ?? null,
        updatedAt: new Date().toISOString(),
      })
    ),
  ];

  // Handle store linking/unlinking separately
  if (storeId !== undefined || currentStoreId) {
    await db.transact(transactions);
    await linkStoreToSavedItem({
      itemId,
      storeId,
      currentStoreId,
    });
  } else {
    await db.transact(transactions);
  }
};

