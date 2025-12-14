import { db } from '../../../lib/instant';

export const useMealPlan = (mealPlanId: string | undefined) => {
  return db.useQuery(
    mealPlanId
      ? {
          meal_plans: {
            $: {
              where: {
                id: mealPlanId,
              },
            },
            meal_plan_recipes: {
              recipe: {
                recipe_ingredients: {},
              },
            },
          },
        }
      : null
  );
};
