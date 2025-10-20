import { eq } from 'drizzle-orm';
import { recipeIngredientTable } from '../../../db/schema';
import { generateId } from '../../../lib/utils';
import { db } from '../../../providers/migration-provider';
import { findOrCreateItem } from '../../shared/db/find-or-create-item';
import { QuantityUnit } from '../../shared/types';

export type AddRecipeIngredientArgs = {
  recipeId: string;
  name: string;
  quantity: number;
  unit: QuantityUnit;
  notes?: string;
  category?: string;
};

export const addRecipeIngredient = async ({
  recipeId,
  name,
  quantity,
  unit,
  notes,
  category,
}: AddRecipeIngredientArgs) => {
  // Get the current max order for this recipe
  const existingIngredients = await db
    .select({ order: recipeIngredientTable.order })
    .from(recipeIngredientTable)
    .where(eq(recipeIngredientTable.recipeId, recipeId))
    .orderBy(recipeIngredientTable.order);

  const nextOrder =
    existingIngredients.length > 0
      ? Math.max(...existingIngredients.map(ing => ing.order)) + 1
      : 0;

  // Find or create the item
  const item = await findOrCreateItem({
    name,
    quantity,
    unit,
    notes,
    category,
  });

  const newIngredient = {
    id: generateId(),
    recipeId,
    itemId: item.id,
    notes,
    order: nextOrder,
  };

  await db.insert(recipeIngredientTable).values(newIngredient);

  return newIngredient;
};
