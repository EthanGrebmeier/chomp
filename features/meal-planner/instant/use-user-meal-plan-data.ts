import { db } from '../../../lib/instant';

export const useUserMealPlanData = () => {
  // Query all user's meal_plan_recipes and meal_plan_items without where clauses
  // Permissions will automatically filter to the current user's data
  // This ensures the query works offline with unsynced data
  return db.useQuery({
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
  });
};

