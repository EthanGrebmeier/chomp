import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { addSavedItemIfNotExists } from '../../saved-items/instant/add-saved-item-if-not-exists';
import { BaseGroceryItem } from '../types';

export const addGroceryListItem = async ({
  listId,
  item,
}: {
  listId: string;
  item: BaseGroceryItem;
}) => {
  const itemId = id();

  await db.transact([
    db.tx.grocery_items[itemId].create({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
      isChecked: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    db.tx.grocery_lists[listId].link({
      grocery_items: itemId,
    }),
  ]);

  // Auto-save item to user's saved items if it doesn't exist
  addSavedItemIfNotExists({
    name: item.name,
    category: item.category,
  });
};
