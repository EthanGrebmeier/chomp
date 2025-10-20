import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  groceryListTable,
  itemTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { normalizeGroceryList } from '../util';

export const getList = async (listId: string) => {
  const result = await db
    .select()
    .from(groceryListTable)
    .leftJoin(
      groceryListItemTable,
      eq(groceryListTable.id, groceryListItemTable.groceryListId)
    )
    .leftJoin(itemTable, eq(groceryListItemTable.itemId, itemTable.id));
  const normalized = normalizeGroceryList(result);

  return normalized[listId];
};
