export type RemoveItemFromMealPlanArgs = {
  mealPlanItemId: string;
};

/**
 * Deletes a standalone meal plan item and, in the same transaction, removes
 * its linked grocery item if unchecked, or unlinks it if checked.
 */
export const removeItemFromMealPlan = async ({
  mealPlanItemId,
}: RemoveItemFromMealPlanArgs) => {
  const { removeQuantityMeals } =
    await import('@/features/quantity/app/meal-actions');
  return removeQuantityMeals([mealPlanItemId]);
};
