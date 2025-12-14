import { useMealPlan as useMealPlanQuery } from '../instant/use-meal-plan';
import { MealPlanWithRecipes } from '../types';

export const useMealPlan = (mealPlanId: string | undefined) => {
  const { data, isLoading, error } = useMealPlanQuery(mealPlanId);

  // Transform data to match the expected format
  const mealPlan = data?.meal_plans?.[0] as MealPlanWithRecipes | undefined;

  return {
    data: mealPlan ?? null,
    isLoading,
    error,
  };
};
