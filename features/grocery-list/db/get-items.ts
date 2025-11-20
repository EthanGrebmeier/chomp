import { eq } from 'drizzle-orm';

import { groceryListItemTable, recipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { GroceryListItemWithRecipe } from '../types';

export const getItems = async (): Promise<GroceryListItemWithRecipe[]> => {
  const result = await db
    .select()
    .from(groceryListItemTable)
    .leftJoin(recipeTable, eq(groceryListItemTable.recipeId, recipeTable.id));

  return result.map(row => ({
    ...row.grocery_list_item,
    recipe: row.recipe ?? null,
  }));
};




