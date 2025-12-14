import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type UpdateRecipeIngredientArgs = {
  ingredientId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    category?: string | null;
    order?: number;
  };
};

export const updateRecipeIngredient = async ({
  ingredientId,
  updates,
}: UpdateRecipeIngredientArgs) => {
  const processedUpdates = {
    ...updates,
    category: updates.category === null ? undefined : updates.category,
  };

  await db.transact([
    tx.recipe_ingredients[ingredientId].update(processedUpdates),
  ]);

  return { ingredientId };
};
