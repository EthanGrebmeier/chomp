import { db } from '../../../lib/instant';

export const removeGroceryListItem = async ({ itemId }: { itemId: string }) => {
  return db.transact([
    db.tx.grocery_items[itemId].update({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    }),
  ]);
};
