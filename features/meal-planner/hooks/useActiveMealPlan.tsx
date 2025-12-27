import { useActiveMealPlan as useActiveMealPlanQuery } from '../instant/use-active-meal-plan';
import { MealPlanQueryResult, MealPlanWithRecipesAndItems } from '../types';

export const useActiveMealPlan = () => {
  const { data, isLoading, error } = useActiveMealPlanQuery();

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter and sort meal plans to find the active one
  const mealPlans = (data?.meal_plans ?? []) as MealPlanQueryResult[];

  // Find the most recently created meal plan that:
  // - is not archived
  // - has a start date <= today
  // - has an end date >= today
  const rawActiveMealPlan = mealPlans
    .filter(plan => {
      const startDate = new Date(plan.startDate);
      const endDate = new Date(plan.endDate);
      return startDate <= today && endDate >= today;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  // Transform to filter out recipes without recipe data
  const activeMealPlan: MealPlanWithRecipesAndItems | null = rawActiveMealPlan
    ? {
        ...rawActiveMealPlan,
        meal_plan_recipes: rawActiveMealPlan.meal_plan_recipes.filter(
          (r): r is typeof r & { recipe: NonNullable<typeof r.recipe> } =>
            r.recipe !== undefined
        ),
      }
    : null;

  return {
    data: activeMealPlan,
    isLoading,
    error,
  };
};
