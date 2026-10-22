import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import {
  buildRecipeIngredientEditTransactions,
  queryRecipeIngredientEditTargets,
} from '../../meal-planner/instant/propagate-recipe-ingredient-edit';

export type RemoveRecipeIngredientArgs = {
  ingredientId: string;
};

/**
 * Removes a recipe ingredient and, in the same transaction, its snapshot rows
 * on planned meals (on lists the editor is a member of) with their unchecked
 * linked grocery items. Checked items stay, losing only the meal plan link.
 */
export const removeRecipeIngredient = async ({
  ingredientId,
}: RemoveRecipeIngredientArgs) => {
  const recipeRows = await queryRecipeIngredientEditTargets({
    recipeIngredientId: ingredientId,
  });

  await db.transact([
    // Removal creates and re-projects nothing, so no default store is needed.
    ...buildRecipeIngredientEditTransactions({
      recipeRows,
      edit: { type: 'remove', ingredientId },
      defaultStore: null,
    }),
    tx.recipe_ingredients[ingredientId].delete(),
  ]);

  return { removedIngredientId: ingredientId };
};
