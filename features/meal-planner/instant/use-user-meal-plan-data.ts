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
          user: {},
        },
        ingredient_snapshots: {
          store: {},
          grocery_item: {},
        },
      },
      meal_plan_items: {
        store: {},
        grocery_item: {},
      },
    },
  });
};
