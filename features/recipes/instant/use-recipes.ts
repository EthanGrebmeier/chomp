import { db } from '../../../lib/instant';

/**
 * Recipe-book query scoped to the signed-in owner.
 *
 * Only ingredients are included because list consumers need their names and
 * counts. Recipe details and grocery-list activity have dedicated fields/hooks.
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
            recipe_ingredients: {},
          },
        }
      : null
  );
};
