import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
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
    db.tx.saved_items[itemId].update(
      trimStringFields({
        ...updates,
        category: updates.category ?? null,
        updatedAt: new Date().toISOString(),
      })
    ),
  ]);
};

