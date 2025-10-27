import { eq } from 'drizzle-orm';
import { recipeIngredientTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { QuantityUnit } from '../../shared/types';

export type UpdateRecipeIngredientArgs = {
  itemId: string;
  recipeId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: QuantityUnit;
    notes?: string;
    category?: string | null;
  };
};

export const updateRecipeIngredient = async ({
  itemId,
  recipeId,
  updates,
}: UpdateRecipeIngredientArgs) => {
  const processedUpdates = {
    ...updates,
    category: updates.category === undefined ? null : updates.category,
    updatedAt: new Date().toISOString(),
  };

  const result = await db
    .update(recipeIngredientTable)
    .set(processedUpdates)
    .where(eq(recipeIngredientTable.id, itemId))
    .returning();

  return { itemId, recipeId, updates, updatedItem: result[0] };
};
