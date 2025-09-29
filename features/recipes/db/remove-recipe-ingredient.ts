import { and, eq } from 'drizzle-orm';
import { recipeIngredientTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { RemoveRecipeIngredientArgs } from '../types';

export const removeRecipeIngredient = async ({
  itemId,
  recipeId,
}: RemoveRecipeIngredientArgs) => {
  await db
    .delete(recipeIngredientTable)
    .where(
      and(
        eq(recipeIngredientTable.id, itemId),
        eq(recipeIngredientTable.recipeId, recipeId)
      )
    );

  return { removedItemId: itemId };
};
