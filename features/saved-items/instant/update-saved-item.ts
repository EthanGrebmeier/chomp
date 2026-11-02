import { transactLocally } from '@/lib/instant/local-transaction';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { BaseSavedItem } from '../types';

import { buildSavedItemStoreTransactions } from './link-store-to-saved-item';

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

  if (storeId !== undefined || currentStoreId) {
    transactions.push(
      ...buildSavedItemStoreTransactions({
        itemId,
        storeId,
        currentStoreId,
      })
    );
  }
  await transactLocally(transactions);
};
