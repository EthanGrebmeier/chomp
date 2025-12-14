import { db } from '../../../lib/instant';

export const useActiveMealPlan = () => {
  // Get today's date at midnight in ISO format
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  return db.useQuery({
    meal_plans: {
      $: {
        where: {
          isArchived: false,
        },
      },
      meal_plan_recipes: {
        recipe: {},
      },
    },
  });
};
