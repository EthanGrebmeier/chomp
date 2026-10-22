import type { TransactionChunk } from '../../../lib/instant';

import {
  buildMealPlanEntryRemovalTransactions,
  type MealPlanEntryRemovalPlan,
  planMealPlanEntryRemoval,
} from './build-meal-plan-entry-removal-transactions';
import type { MealPlanRecipeSyncRow } from './meal-plan-entry-sync-context';

export type LeaveListCleanupPlan = MealPlanEntryRemovalPlan & {
  /** Planned meals on the list that use the leaver's recipes. */
  mealPlanRecipeIds: string[];
};

export type PlanLeaveListCleanupArgs = {
  /** The list being left. */
  listId: string;
  /** The user leaving the list. */
  userId: string;
  /**
   * Planned meals loaded with their recipe's owner. Rows on other lists, or
   * whose recipe isn't (known to be) owned by the leaver, are ignored.
   */
  recipeRows: MealPlanRecipeSyncRow[];
};

const rowsToRemove = ({
  listId,
  userId,
  recipeRows,
}: PlanLeaveListCleanupArgs) =>
  recipeRows.filter(
    row => row.grocery_list?.id === listId && row.recipe?.user?.id === userId
  );

/**
 * Plans what leaving a list does to its meal plan: every planned meal that
 * uses one of the leaver's recipes is deleted (its snapshot rows cascade with
 * it), its unchecked linked grocery items are removed, and its checked or
 * soft-deleted ones only lose their meal plan link, staying as history.
 * Standalone meal plan items are never touched.
 *
 * Pure and tx-free.
 */
export const planLeaveListCleanup = (
  args: PlanLeaveListCleanupArgs
): LeaveListCleanupPlan => {
  const recipeRows = rowsToRemove(args);

  return {
    mealPlanRecipeIds: recipeRows.map(row => row.id),
    ...planMealPlanEntryRemoval({ recipeRows }),
  };
};

/**
 * Builds the cleanup transaction to run before the leaver's share is deleted
 * (see `planLeaveListCleanup`). Empty when there is nothing to clean up.
 */
export const buildLeaveListCleanupTransactions = (
  args: PlanLeaveListCleanupArgs
): TransactionChunk[] =>
  buildMealPlanEntryRemovalTransactions({ recipeRows: rowsToRemove(args) });
