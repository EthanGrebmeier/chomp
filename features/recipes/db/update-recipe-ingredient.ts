import { eq } from 'drizzle-orm';
import { recipeIngredientTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { updateItem } from '../../shared/db/update-item';
import { QuantityUnit } from '../../shared/types';

export type UpdateRecipeIngredientArgs = {
  itemId: string;
  recipeId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: QuantityUnit;
    notes?: string;
    category?: string;
  };
};

export const updateRecipeIngredient = async ({
  itemId,
  recipeId,
  updates,
}: UpdateRecipeIngredientArgs) => {
  // Get the recipe ingredient to find the associated item
  const recipeIngredient = await db
    .select({ itemId: recipeIngredientTable.itemId })
    .from(recipeIngredientTable)
    .where(eq(recipeIngredientTable.id, itemId))
    .limit(1);

  if (recipeIngredient.length === 0) {
    throw new Error('Recipe ingredient not found');
  }

  // Update the item
  const updatedItem = await updateItem({
    itemId: recipeIngredient[0].itemId,
    updates,
  });

  return { itemId, recipeId, updates, updatedItem };
};
