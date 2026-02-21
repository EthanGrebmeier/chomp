import { db } from '../../../lib/instant';

export const useMealPlanData = (listId?: string) => {
  return db.useQuery({
    grocery_lists: {
      $: {
        where: {
          id: listId ?? '',
        },
      },
      meal_plan_recipes: {
        recipe: {
          recipe_ingredients: {
            store: {},
          },
        },
      },
      meal_plan_items: {
        store: {},
      },
    },
  });
};

