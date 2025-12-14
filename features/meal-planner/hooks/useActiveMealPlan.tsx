import { useActiveMealPlan as useActiveMealPlanQuery } from '../instant/use-active-meal-plan';
import { MealPlanWithRecipes } from '../types';

export const useActiveMealPlan = () => {
  const { data, isLoading, error } = useActiveMealPlanQuery();

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter and sort meal plans to find the active one
  const mealPlans = data?.meal_plans ?? [];

  // Find the most recently created meal plan that:
  // - is not archived
  // - has a start date <= today
  // - has an end date >= today
  const activeMealPlan = mealPlans
    .filter(plan => {
      const startDate = new Date(plan.startDate);
      const endDate = new Date(plan.endDate);
      return startDate <= today && endDate >= today;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0] as MealPlanWithRecipes | undefined;

  return {
    data: activeMealPlan ?? null,
    isLoading,
    error,
  };
};
