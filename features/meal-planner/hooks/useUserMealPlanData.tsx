import { useUserMealPlanData as useUserMealPlanDataQuery } from '../instant/use-user-meal-plan-data';
import { MealPlanRecipeWithRecipe } from '../types';

export const useUserMealPlanData = () => {
  const { data, isLoading, error } = useUserMealPlanDataQuery();

  // Filter out recipes that don't have recipe data loaded
  const recipes: MealPlanRecipeWithRecipe[] =
    data?.meal_plan_recipes?.filter(
      (r): r is MealPlanRecipeWithRecipe => r.recipe !== undefined
    ) ?? [];

  return {
    recipes,
    items: data?.meal_plan_items ?? [],
    isLoading,
    error,
  };
};

