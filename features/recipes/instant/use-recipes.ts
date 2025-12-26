import { db } from '../../../lib/instant';

export const useRecipes = () => {
  return db.useQuery({
    recipes: {
      recipe_ingredients: {
        store: {},
      },
      user: {},
    },
  });
};
