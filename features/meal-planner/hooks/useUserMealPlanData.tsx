import { useMemo } from 'react';

import { useMealPlanData } from '../instant/use-user-meal-plan-data';
import { MealPlanItemWithStore, MealPlanRecipeWithRecipe } from '../types';

const EMPTY_ITEMS: MealPlanItemWithStore[] = [];

export const useUserMealPlanData = (listId?: string) => {
  const { data, isLoading, error } = useMealPlanData(listId);
  const activeList = data?.grocery_lists?.[0];

  // Filter out recipes that don't have recipe data loaded
  const mealPlanRecipes = activeList?.meal_plan_recipes;
  const recipes = useMemo(
    () =>
      (mealPlanRecipes ?? []).filter(
        recipe => recipe.recipe !== undefined
      ) as MealPlanRecipeWithRecipe[],
    [mealPlanRecipes]
  );

  return {
    recipes,
    items: activeList?.meal_plan_items ?? EMPTY_ITEMS,
    isLoading,
    error,
  };
};
