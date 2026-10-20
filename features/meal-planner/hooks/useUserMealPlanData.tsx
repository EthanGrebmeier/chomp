import { useMemo } from 'react';

import { mealProjection } from '@/features/quantity/app/projection';
import { useQuantityList } from '@/features/quantity/app/session';
import { quantityWorkspaceAvailable } from '@/features/quantity/config';
import { db } from '@/lib/instant';

import { useMealPlanData } from '../instant/use-user-meal-plan-data';
import { MealPlanItemWithStore, MealPlanRecipeWithRecipe } from '../types';

const EMPTY_ITEMS: MealPlanItemWithStore[] = [];

export const useUserMealPlanData = (listId?: string) => {
  const enabled = quantityWorkspaceAvailable();
  const quantity = useQuantityList(listId);
  const sources = db.useQuery(
    enabled
      ? { stores: {}, recipes: { recipe_ingredients: { store: {} }, user: {} } }
      : null
  );
  const projected = useMemo(
    () =>
      mealProjection(
        quantity.state,
        sources.data?.stores,
        sources.data?.recipes
      ),
    [quantity.state, sources.data]
  );
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
    recipes: enabled ? projected.recipes : recipes,
    items: enabled
      ? projected.items
      : (activeList?.meal_plan_items ?? EMPTY_ITEMS),
    isLoading: enabled ? quantity.loading : isLoading,
    error: enabled
      ? quantity.error
        ? { message: quantity.error }
        : null
      : error,
  };
};
