import { eq } from 'drizzle-orm';
import {
  groceryListItemTable,
  groceryListTable,
  recipeTable,
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
    .leftJoin(recipeTable, eq(groceryListItemTable.recipeId, recipeTable.id))
    .where(eq(groceryListTable.id, listId));
  const normalized = normalizeGroceryList(result);

  return normalized[listId];
};
