import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

export type UpdateMealPlanRecipeArgs = {
  mealPlanRecipeId: string;
  updates: {
    mealTag?: string;
    servings?: number;
    order?: number;
    recipeId?: string;
    date?: string;
  };
  /** List default store, applied to linked items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
};

/**
 * Updates a meal plan recipe and, in the same transaction, its linked
 * unchecked grocery items:
 *
 * - servings changes re-project quantities that aren't overridden;
 * - date and meal tag changes leave the items as they are, but still go
 *   through the sync planner so there is one code path;
 * - swapping the recipe replaces the ingredient snapshots with the new
 *   recipe's ingredients (all selected), so the old unchecked items are
 *   deleted, checked ones are unlinked, and new ones are created.
 */
export const updateMealPlanRecipe = async ({
  mealPlanRecipeId,
  updates,
  defaultStore,
}: UpdateMealPlanRecipeArgs) => {
  const { updateQuantityMeal } =
    await import('@/features/quantity/app/meal-actions');
  return updateQuantityMeal({ mealPlanRecipeId, updates, defaultStore });
};
