import { eq } from 'drizzle-orm';
import { recipeIngredientTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../types';

export type UpdateRecipeIngredientArgs = {
  itemId: string;
  recipeId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: QuantityUnit;
    notes?: string;
  };
};

export const updateRecipeIngredient = async ({
  itemId,
  recipeId,
  updates,
}: UpdateRecipeIngredientArgs) => {
  await db
    .update(recipeIngredientTable)
    .set(updates)
    .where(eq(recipeIngredientTable.id, itemId));

  return { itemId, recipeId, updates };
};
