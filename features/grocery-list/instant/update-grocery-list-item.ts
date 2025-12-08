import { db } from '../../../lib/instant';
import { GroceryListItem } from '../types';

export const updateGroceryListItem = async ({
  itemId,
  item,
}: {
  itemId: string;
  item: Partial<GroceryListItem>;
}) => {
  await db.transact([db.tx.grocery_items[itemId].update(item)]);
};
