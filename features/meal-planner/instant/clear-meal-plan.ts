import { quantityWorkspaceAvailable } from '@/features/quantity/config';

import { db } from '../../../lib/instant';

import { buildMealPlanEntryRemovalTransactions } from './build-meal-plan-entry-removal-transactions';
import { queryMealPlanEntrySyncRows } from './query-meal-plan-entry-sync-rows';

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
  if (quantityWorkspaceAvailable()) {
    const { removeQuantityMeals } =
      await import('@/features/quantity/app/meal-actions');
    return removeQuantityMeals([...mealPlanRecipeIds, ...mealPlanItemIds]);
  }

  if (mealPlanRecipeIds.length === 0 && mealPlanItemIds.length === 0) {
    return;
  }

  const rows = await queryMealPlanEntrySyncRows({
    mealPlanRecipeIds,
    mealPlanItemIds,
  });

  await db.transact(buildMealPlanEntryRemovalTransactions(rows));
};
