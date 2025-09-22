import { generateId } from '@/lib/utils';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { GroceryListItem } from '../types';

type CreateListItemArgs = {
  item: Omit<GroceryListItem, 'id'>;
};

export const createListItem = ({ item }: CreateListItemArgs) => {
  return db.insert(groceryListItemTable).values({
    id: generateId(),
    groceryListId: item.groceryListId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
  });
};
