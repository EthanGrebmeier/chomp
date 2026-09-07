type UnaddedMealPlanRecipe = {
  id: string;
  recipe?: { id: string } | null;
};

type UnaddedMealPlanItem = {
  id: string;
};

/**
 * Whether the meal plan has anything left to push to the grocery list.
 * Meal plan recipes whose source recipe has been deleted are ignored, matching
 * what the meal planner screen renders.
 */
export const hasUnaddedMealPlanEntries = ({
  recipes,
  items,
}: {
  recipes: readonly UnaddedMealPlanRecipe[];
  items: readonly UnaddedMealPlanItem[];
}): boolean =>
  recipes.some(recipe => Boolean(recipe.recipe)) || items.length > 0;
