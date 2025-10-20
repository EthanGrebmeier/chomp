import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  groceryListTable,
  itemTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { normalizeGroceryList } from '../util';

export const getLists = async () => {
  const groceryList = await db
    .select()
    .from(groceryListTable)
    .leftJoin(
      groceryListItemTable,
      eq(groceryListTable.id, groceryListItemTable.groceryListId)
    )
    .leftJoin(itemTable, eq(groceryListItemTable.itemId, itemTable.id));
  const result = normalizeGroceryList(groceryList);
  return Object.values(result);
};
