import { isMealPlanEntryAddable } from './meal-plan-addable-window';

type UnaddedMealPlanRecipe = {
  id: string;
  date: string;
  recipe?: { id: string } | null;
};

type UnaddedMealPlanItem = {
  id: string;
  date: string;
};

/**
 * Whether the meal plan has anything left to push to the grocery list.
 * Meal plan recipes whose source recipe has been deleted are ignored, matching
 * what the meal planner screen renders. Stale meals more than a few days old are
 * disregarded so they never light up the "unadded" indicator.
 */
export const hasUnaddedMealPlanEntries = ({
  recipes,
  items,
}: {
  recipes: readonly UnaddedMealPlanRecipe[];
  items: readonly UnaddedMealPlanItem[];
}): boolean =>
  recipes.some(
    recipe => Boolean(recipe.recipe) && isMealPlanEntryAddable(recipe.date)
  ) || items.some(item => isMealPlanEntryAddable(item.date));
