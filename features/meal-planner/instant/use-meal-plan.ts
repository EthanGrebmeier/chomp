import { useMemo } from 'react';

import { db } from '../../../lib/instant';

export const useMealPlan = (mealPlanId: string | undefined) => {
  // Query all meal plans instead of using where clause
  // This ensures offline-created meal plans are found (where clauses don't work for unsynced data)
  const query = db.useQuery(
    mealPlanId
      ? {
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
        }
      : null
  );

  // Filter client-side to find the specific meal plan
  const data = useMemo(() => {
    if (!query.data?.meal_plans || !mealPlanId) return null;
    const mealPlan = query.data.meal_plans.find(mp => mp.id === mealPlanId);
    return mealPlan ? { meal_plans: [mealPlan] } : { meal_plans: [] };
  }, [query.data?.meal_plans, mealPlanId]);

  return {
    ...query,
    data,
  };
};
