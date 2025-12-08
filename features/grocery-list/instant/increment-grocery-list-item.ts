import { db } from '../../../lib/instant';

export const incrementGroceryListItem = async ({
  itemId,
  quantityToAdd,
}: {
  itemId: string;
  quantityToAdd: number;
}) => {
  const existingItemQuery = await db.queryOnce({
    grocery_items: {
      $: {
        where: {
          id: itemId,
        },
      },
    },
  });

  const existingItem = existingItemQuery.data.grocery_items[0];

  if (!existingItem) {
    return;
  }

  const newQuantity = existingItem.quantity + quantityToAdd;

  return db.transact([
    db.tx.grocery_items[itemId].update({ quantity: newQuantity }),
  ]);
};
