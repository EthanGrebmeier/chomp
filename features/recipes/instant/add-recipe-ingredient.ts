import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type AddRecipeIngredientArgs = {
  recipeId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string | null;
  order?: number;
};

export const addRecipeIngredient = async ({
  recipeId,
  name,
  quantity,
  unit,
  notes,
  category,
  order = 0,
}: AddRecipeIngredientArgs) => {
  const ingredientId = id();

  await db.transact([
    tx.recipe_ingredients[ingredientId].create({
      name,
      quantity,
      unit,
      notes,
      category: category ?? undefined,
      order,
    }),
    tx.recipe_ingredients[ingredientId].link({
      recipe: recipeId,
    }),
  ]);

  return { id: ingredientId };
};
