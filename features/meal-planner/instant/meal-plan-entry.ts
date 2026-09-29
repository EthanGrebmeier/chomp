import { id, tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

import { buildMealPlanListSyncTransactions } from './build-meal-plan-list-sync-transactions';
import { buildSnapshotRowCreateTransactions } from './build-snapshot-row-create-transactions';
import {
  type MealPlanEntrySyncContext,
  toMealPlanItemSyncContext,
  toMealPlanRecipeSyncContext,
} from './meal-plan-entry-sync-context';
import { planMealPlanEntryIgnored } from './plan-meal-plan-entry-ignored';
import type { MealPlanEntryForSync } from './plan-meal-plan-list-sync';
import {
  queryMealPlanItemSyncRow,
  queryMealPlanRecipeSyncRow,
} from './query-meal-plan-entry-sync-rows';

/** Which kind of meal plan entry: a `meal_plan_recipes` or `meal_plan_items` row. */
export type MealPlanEntryType = 'recipe' | 'item';

/** Points at one meal plan entry, recipe or standalone item. */
export type MealPlanEntryRef = {
  type: MealPlanEntryType;
  /** `meal_plan_recipes` or `meal_plan_items` id, per `type`. */
  id: string;
};

/**
 * True when the entry is "meal plan only": it stays on the meal plan but is
 * kept off the grocery list. Works for recipes and items alike.
 */
export const isMealPlanOnly = (entry: {
  ignoredByGroceryList?: boolean | null;
}): boolean => entry.ignoredByGroceryList === true;

export type SetMealPlanEntryIgnoredArgs = MealPlanEntryRef & {
  ignored: boolean;
  /** List default store, applied to re-created linked items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
};

const entryNamespace = (type: MealPlanEntryType) =>
  type === 'recipe' ? tx.meal_plan_recipes : tx.meal_plan_items;

const querySyncContext = async ({
  type,
  id: entryId,
}: MealPlanEntryRef): Promise<{
  found: boolean;
  context: MealPlanEntrySyncContext<MealPlanEntryForSync> | null;
}> => {
  if (type === 'recipe') {
    const row = await queryMealPlanRecipeSyncRow({
      mealPlanRecipeId: entryId,
    });
    return {
      found: row !== null,
      context: row ? toMealPlanRecipeSyncContext(row) : null,
    };
  }

  const row = await queryMealPlanItemSyncRow(entryId);
  return {
    found: row !== null,
    context: row ? toMealPlanItemSyncContext(row) : null,
  };
};

/**
 * Turns "meal plan only" on or off for a meal plan entry and, in the same
 * transaction, brings its linked grocery items in line (see
 * `planMealPlanEntryIgnored`): ignoring removes the unchecked ones, and
 * un-ignoring restores the selection the entry had before.
 */
export const setMealPlanEntryIgnored = async ({
  type,
  id: entryId,
  ignored,
  defaultStore,
}: SetMealPlanEntryIgnoredArgs) => {
  const { found, context } = await querySyncContext({ type, id: entryId });
  if (!found) {
    throw new Error(
      type === 'recipe'
        ? 'Meal plan recipe not found'
        : 'Meal plan item not found'
    );
  }

  const now = new Date().toISOString();
  const transactions: TransactionChunk[] = [
    entryNamespace(type)[entryId].update({
      ignoredByGroceryList: ignored,
      updatedAt: now,
    }),
  ];

  // Without a list (or recipe) there are no linked items to sync.
  if (context) {
    const plan = planMealPlanEntryIgnored({
      entry: context.entry,
      ignored,
      defaultStore,
      createId: id,
    });

    transactions.push(
      ...plan.snapshotRowIdsToSelect.map(snapshotRowId =>
        tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].update({
          isSelected: true,
        })
      ),
      ...buildSnapshotRowCreateTransactions({
        mealPlanRecipeId: entryId,
        rows: plan.snapshotRowsToCreate,
      }),
      ...buildMealPlanListSyncTransactions({
        listId: context.listId,
        plan: plan.listSync,
        now,
      })
    );
  }

  await db.transact(transactions);
};
