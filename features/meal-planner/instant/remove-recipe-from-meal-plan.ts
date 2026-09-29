import { db } from '../../../lib/instant';

import { buildMealPlanEntryRemovalTransactions } from './build-meal-plan-entry-removal-transactions';
import { queryMealPlanRecipeSyncRow } from './query-meal-plan-entry-sync-rows';

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
  const row = await queryMealPlanRecipeSyncRow({ mealPlanRecipeId });
  if (!row) {
    return;
  }

  await db.transact(
    buildMealPlanEntryRemovalTransactions({ recipeRows: [row] })
  );
};
