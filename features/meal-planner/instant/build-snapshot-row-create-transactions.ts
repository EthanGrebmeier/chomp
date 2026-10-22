import { tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import type { MealPlanIngredientSnapshotCreateInput } from '../meal-plan-recipe-ingredient-editor';

export type SnapshotRowToWrite = MealPlanIngredientSnapshotCreateInput & {
  /** Id the snapshot row is created with. */
  id: string;
};

/**
 * Builds the writes that create ingredient snapshot rows for a meal plan
 * recipe, linking each to the entry and, when set, to its store.
 */
export const buildSnapshotRowCreateTransactions = ({
  mealPlanRecipeId,
  rows,
}: {
  mealPlanRecipeId: string;
  rows: SnapshotRowToWrite[];
}): TransactionChunk[] =>
  rows.flatMap(row => {
    const transactions: TransactionChunk[] = [
      tx.meal_plan_recipe_ingredient_snapshots[row.id].update(
        trimStringFields({
          sourceRecipeIngredientId: row.sourceRecipeIngredientId,
          name: row.name,
          quantity: row.quantity,
          unit: row.unit,
          notes: row.notes ?? null,
          category: row.category ?? null,
          isSelected: row.isSelected,
          isQuantityOverridden: row.isQuantityOverridden,
        })
      ),
      tx.meal_plan_recipe_ingredient_snapshots[row.id].link({
        meal_plan_recipe: mealPlanRecipeId,
      }),
    ];

    if (row.storeId) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[row.id].link({
          store: row.storeId,
        })
      );
    }

    return transactions;
  });
