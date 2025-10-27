import { and, eq } from 'drizzle-orm';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export type IncrementRecipeQuantitiesArgs = {
  recipeId: string;
  groceryListId: string;
};

export const incrementRecipeQuantities = async ({
  recipeId,
  groceryListId,
}: IncrementRecipeQuantitiesArgs) => {
  // Get all existing grocery list items for this recipe
  const existingItems = await db
    .select()
    .from(groceryListItemTable)
    .where(
      and(
        eq(groceryListItemTable.groceryListId, groceryListId),
        eq(groceryListItemTable.recipeId, recipeId)
      )
    );

  // Double the quantity for each item
  for (const item of existingItems) {
    await db
      .update(groceryListItemTable)
      .set({ quantity: item.quantity * 2 })
      .where(eq(groceryListItemTable.id, item.id));
  }

  return { updatedItems: existingItems.length };
};
