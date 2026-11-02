export type ClearMealPlanArgs = {
  mealPlanRecipeIds: string[];
  mealPlanItemIds: string[];
};

/**
 * Deletes the given meal plan entries and, in the same transaction, removes
 * their unchecked linked grocery items and unlinks their checked ones.
 */
export const clearMealPlan = async ({
  mealPlanRecipeIds,
  mealPlanItemIds,
}: ClearMealPlanArgs) => {
  const { removeQuantityMeals } =
    await import('@/features/quantity/app/meal-actions');
  return removeQuantityMeals([...mealPlanRecipeIds, ...mealPlanItemIds]);
};
