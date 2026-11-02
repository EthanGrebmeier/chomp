import { tx } from '@instantdb/react-native';

import { transactLocally } from '@/lib/instant/local-transaction';

export type RemoveRecipeIngredientArgs = {
  ingredientId: string;
};

/** Catalog changes are propagated to quantity sessions by QuantityAppProvider. */
export const removeRecipeIngredient = async ({
  ingredientId,
}: RemoveRecipeIngredientArgs) => {
  await transactLocally([tx.recipe_ingredients[ingredientId].delete()]);

  return { removedIngredientId: ingredientId };
};
