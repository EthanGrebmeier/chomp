import { tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

import { buildMealPlanListSyncTransactions } from './build-meal-plan-list-sync-transactions';
import { buildSnapshotRowCreateTransactions } from './build-snapshot-row-create-transactions';
import type { RecipeIngredientEditEntryPlan } from './plan-recipe-ingredient-edit-propagation';

/**
 * Turns `planRecipeIngredientEditPropagation` plans into transaction chunks
 * for the recipe edit's `db.transact`. Snapshot rows are created before the
 * linked items that point at them, and deleted after their items detach.
 */
export const buildRecipeIngredientEditPropagationTransactions = ({
  plans,
  now,
}: {
  plans: RecipeIngredientEditEntryPlan[];
  now?: string;
}): TransactionChunk[] =>
  plans.flatMap(plan => [
    ...buildSnapshotRowCreateTransactions({
      mealPlanRecipeId: plan.mealPlanRecipeId,
      rows: plan.snapshotRowsToCreate,
    }),
    ...plan.snapshotRowUpdates.flatMap(
      ({ snapshotRowId, fields, storeId, previousStoreId }) => {
        const snapshot =
          tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId];
        const transactions: TransactionChunk[] = [
          snapshot.update(trimStringFields(fields)),
        ];
        if (storeId !== previousStoreId) {
          if (previousStoreId) {
            transactions.push(snapshot.unlink({ store: previousStoreId }));
          }
          if (storeId) {
            transactions.push(snapshot.link({ store: storeId }));
          }
        }
        return transactions;
      }
    ),
    ...buildMealPlanListSyncTransactions({
      listId: plan.listId,
      plan: plan.listSync,
      now,
    }),
    ...plan.snapshotRowIdsToDelete.map(rowId =>
      tx.meal_plan_recipe_ingredient_snapshots[rowId].delete()
    ),
  ]);
