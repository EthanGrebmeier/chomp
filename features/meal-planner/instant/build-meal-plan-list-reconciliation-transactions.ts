import { tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';

import { buildMealPlanListSyncTransactions } from './build-meal-plan-list-sync-transactions';
import { buildSnapshotRowCreateTransactions } from './build-snapshot-row-create-transactions';
import type { MealPlanListReconciliationPlan } from './plan-meal-plan-list-reconciliation';

/**
 * Turns a `planMealPlanListReconciliation` plan into transaction chunks for
 * one `db.transact`. Snapshot rows are created before the linked items that
 * point at them.
 */
export const buildMealPlanListReconciliationTransactions = ({
  listId,
  plan,
  now,
}: {
  /** List the meal plan belongs to; created linked items are added here. */
  listId: string;
  plan: MealPlanListReconciliationPlan;
  now?: string;
}): TransactionChunk[] => [
  ...plan.snapshotRowsToCreate.flatMap(({ mealPlanRecipeId, rows }) =>
    buildSnapshotRowCreateTransactions({ mealPlanRecipeId, rows })
  ),
  ...buildMealPlanListSyncTransactions({
    listId,
    plan: { ...plan.listSync, updates: [] },
    now,
  }),
  ...plan.snapshotRowIdsToDelete.map(rowId =>
    tx.meal_plan_recipe_ingredient_snapshots[rowId].delete()
  ),
];
