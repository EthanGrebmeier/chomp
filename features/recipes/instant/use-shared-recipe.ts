import { db } from '../../../lib/instant';

/**
 * Loads a recipe someone shared by link. Shared recipes are usually private,
 * so the id is sent as a rule param that the `recipes` view permission checks.
 */
export const useSharedRecipe = (recipeId: string | undefined) => {
  return db.useQuery(
    recipeId
      ? {
          recipes: {
            $: { where: { id: recipeId } },
            recipe_ingredients: {},
            user: {},
          },
        }
      : null,
    recipeId ? { ruleParams: { sharedRecipeId: recipeId } } : undefined
  );
};
