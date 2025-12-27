import { db } from '../../../lib/instant';

export const useMealPlans = () => {
  return db.useQuery({
    meal_plans: {
      meal_plan_recipes: {
        recipe: {
          recipe_ingredients: {},
        },
      },
      meal_plan_items: {
        store: {},
      },
    },
  });
};
