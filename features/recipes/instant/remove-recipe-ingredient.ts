import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type RemoveRecipeIngredientArgs = {
  ingredientId: string;
};

/** Catalog changes are propagated to quantity sessions by QuantityAppProvider. */
export const removeRecipeIngredient = async ({
  ingredientId,
}: RemoveRecipeIngredientArgs) => {
  await db.transact([tx.recipe_ingredients[ingredientId].delete()]);

  return { removedIngredientId: ingredientId };
};
