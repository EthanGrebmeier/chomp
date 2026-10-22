import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

export type UpdateMealPlanItemArgs = {
  mealPlanItemId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    category?: string;
    /** An empty string clears the store. */
    storeId?: string;
    date?: string;
    mealTag?: string;
  };
  /** List default store, applied to the linked item when it has no store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
};

/**
 * Updates a standalone meal plan item and, in the same transaction, its linked
 * unchecked grocery item. Date and meal tag edits leave the grocery item as
 * is, but still go through the sync planner so there is one code path.
 */
export const updateMealPlanItem = async ({
  mealPlanItemId,
  updates,
  defaultStore,
}: UpdateMealPlanItemArgs) => {
  const { updateQuantityItem } =
    await import('@/features/quantity/app/meal-actions');
  return updateQuantityItem({ mealPlanItemId, updates, defaultStore });
};
