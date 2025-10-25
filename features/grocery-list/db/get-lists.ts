import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  groceryListTable,
  itemTable,
  recipeTable,
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
    .leftJoin(itemTable, eq(groceryListItemTable.itemId, itemTable.id))
    .leftJoin(recipeTable, eq(groceryListItemTable.recipeId, recipeTable.id));
  const result = normalizeGroceryList(groceryList);
  return Object.values(result);
};
