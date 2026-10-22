import { db } from '../../../lib/instant';

/**
 * Recipe-book query scoped to the signed-in owner.
 *
 * Include ingredient stores so recipe selection preserves store attribution
 * when creating meal-plan snapshots or grocery items. Recipe details and
 * grocery-list activity have dedicated fields/hooks.
 */
export const useRecipes = () => {
  const { user } = db.useAuth();

  return db.useQuery(
    user
      ? {
          recipes: {
            $: {
              where: {
                'user.id': user.id,
              },
            },
            recipe_ingredients: {
              store: {},
            },
          },
        }
      : null
  );
};
