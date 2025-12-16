import { db } from '../../../lib/instant';
import { BaseSavedItem } from '../types';

export type UpdateSavedItemArgs = {
  itemId: string;
  updates: Partial<BaseSavedItem>;
};

export const updateSavedItem = async ({
  itemId,
  updates,
}: UpdateSavedItemArgs) => {
  await db.transact([
    db.tx.saved_items[itemId].update({
      ...updates,
      updatedAt: new Date().toISOString(),
    }),
  ]);
};

