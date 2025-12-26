import { useMemo } from 'react';

import { db } from '../../../lib/instant';

export const useRecipe = (recipeId: string | undefined) => {
  // Query all recipes instead of using where clause
  // This ensures offline-created recipes are found (where clauses don't work for unsynced data)
  const query = db.useQuery(
    recipeId
      ? {
          recipes: {
            recipe_ingredients: {
              store: {},
            },
            user: {},
          },
        }
      : null
  );

  // Filter client-side to find the specific recipe
  const data = useMemo(() => {
    if (!query.data?.recipes || !recipeId) return null;
    const recipe = query.data.recipes.find(r => r.id === recipeId);
    return recipe ? { recipes: [recipe] } : { recipes: [] };
  }, [query.data?.recipes, recipeId]);

  return {
    ...query,
    data,
  };
};
