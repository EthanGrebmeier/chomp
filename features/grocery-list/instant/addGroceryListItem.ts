import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { GroceryListItem } from '../types';

export const addGroceryListItem = async ({
  listId,
  item,
}: {
  listId: string;
  item: Omit<GroceryListItem, 'id'>;
}) => {
  const itemId = id();

  await db.transact([
    db.tx.grocery_items[itemId].create({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      isChecked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    db.tx.grocery_lists[listId].link({
      grocery_items: itemId,
    }),
  ]);
};
