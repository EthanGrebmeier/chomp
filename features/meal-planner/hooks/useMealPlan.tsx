import { useMealPlan as useMealPlanQuery } from '../instant/use-meal-plan';
import {
  MealPlanQueryResult,
  MealPlanWithRecipesAndItems,
} from '../types';

export const useMealPlan = (mealPlanId: string | undefined) => {
  const { data, isLoading, error } = useMealPlanQuery(mealPlanId);

  // Transform data to match the expected format, filtering out recipes without recipe data
  const rawMealPlan = data?.meal_plans?.[0] as MealPlanQueryResult | undefined;

  const mealPlan: MealPlanWithRecipesAndItems | null = rawMealPlan
    ? {
        ...rawMealPlan,
        meal_plan_recipes: rawMealPlan.meal_plan_recipes.filter(
          (r): r is typeof r & { recipe: NonNullable<typeof r.recipe> } =>
            r.recipe !== undefined
        ),
      }
    : null;

  return {
    data: mealPlan,
    isLoading,
    error,
  };
};
