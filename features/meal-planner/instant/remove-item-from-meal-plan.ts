import { db } from '../../../lib/instant';

import { buildMealPlanEntryRemovalTransactions } from './build-meal-plan-entry-removal-transactions';
import { queryMealPlanItemSyncRow } from './query-meal-plan-entry-sync-rows';

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
  const row = await queryMealPlanItemSyncRow(mealPlanItemId);
  if (!row) {
    return;
  }

  await db.transact(buildMealPlanEntryRemovalTransactions({ itemRows: [row] }));
};
