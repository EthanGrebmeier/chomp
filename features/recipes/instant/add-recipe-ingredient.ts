import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { addSavedItemIfNotExists } from '../../saved-items/instant/add-saved-item-if-not-exists';

export type AddRecipeIngredientArgs = {
  recipeId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string | null;
};

export const addRecipeIngredient = async ({
  recipeId,
  name,
  quantity,
  unit,
  notes,
  category,
}: AddRecipeIngredientArgs) => {
  const ingredientId = id();

  await db.transact([
    tx.recipe_ingredients[ingredientId].create({
      name,
      quantity,
      unit,
      notes,
      category: category ?? undefined,
    }),
    tx.recipe_ingredients[ingredientId].link({
      recipe: recipeId,
    }),
  ]);

  // Auto-save ingredient to user's saved items if it doesn't exist
  addSavedItemIfNotExists({
    name,
    category: category ?? undefined,
  });

  return { id: ingredientId };
};
