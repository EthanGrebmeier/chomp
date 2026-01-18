import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export const removeGroceryListItem = async ({ itemId }: { itemId: string }) => {
  return db.transact([
    db.tx.grocery_items[itemId].update(
      trimStringFields({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      })
    ),
  ]);
};
