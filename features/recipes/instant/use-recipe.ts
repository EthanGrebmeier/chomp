import { db } from '../../../lib/instant';

export const useRecipe = (recipeId: string | undefined) => {
  return db.useQuery(
    recipeId
      ? {
          recipes: {
            $: {
              where: {
                id: recipeId,
              },
            },
            recipe_ingredients: {},
          },
        }
      : null
  );
};
