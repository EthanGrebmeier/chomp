import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type RemoveRecipeIngredientArgs = {
  ingredientId: string;
};

export const removeRecipeIngredient = async ({
  ingredientId,
}: RemoveRecipeIngredientArgs) => {
  await db.transact([tx.recipe_ingredients[ingredientId].delete()]);

  return { removedIngredientId: ingredientId };
};
