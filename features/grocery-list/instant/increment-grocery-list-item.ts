import { db } from '../../../lib/instant';

export const incrementGroceryListItem = async ({
  itemId,
  quantityToAdd,
}: {
  itemId: string;
  quantityToAdd: number;
}) => {
  // Query all grocery items and filter client-side
  // This ensures offline-created items are found (where clauses don't work for unsynced data)
  const existingItemQuery = await db.queryOnce({
    grocery_items: {},
  });

  const existingItem = existingItemQuery.data.grocery_items.find(
    item => item.id === itemId
  );

  if (!existingItem) {
    return;
  }

  const newQuantity = existingItem.quantity + quantityToAdd;

  return db.transact([
    db.tx.grocery_items[itemId].update({ quantity: newQuantity }),
  ]);
};
