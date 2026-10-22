export type RemoveRecipeFromMealPlanArgs = {
  mealPlanRecipeId: string;
};

/**
 * Deletes a meal plan recipe and, in the same transaction, removes its
 * unchecked linked grocery items and unlinks its checked ones.
 */
export const removeRecipeFromMealPlan = async ({
  mealPlanRecipeId,
}: RemoveRecipeFromMealPlanArgs) => {
  const { removeQuantityMeals } =
    await import('@/features/quantity/app/meal-actions');
  return removeQuantityMeals([mealPlanRecipeId]);
};
