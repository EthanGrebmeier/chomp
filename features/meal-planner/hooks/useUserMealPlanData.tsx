import { useMealPlanData } from '../instant/use-user-meal-plan-data';
import { MealPlanRecipeWithRecipe } from '../types';

export const useUserMealPlanData = (listId?: string) => {
  const { data, isLoading, error } = useMealPlanData(listId);
  const activeList = data?.grocery_lists?.[0];

  // Filter out recipes that don't have recipe data loaded
  const recipes = (activeList?.meal_plan_recipes ?? []).filter(
    recipe => recipe.recipe !== undefined
  ) as MealPlanRecipeWithRecipe[];

  return {
    recipes,
    items: activeList?.meal_plan_items ?? [],
    isLoading,
    error,
  };
};
