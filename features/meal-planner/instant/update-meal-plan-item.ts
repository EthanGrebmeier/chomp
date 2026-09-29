import { tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

import { applyMealPlanItemEdit } from './apply-meal-plan-entry-edits';
import { buildMealPlanEntrySyncTransactions } from './build-meal-plan-list-sync-transactions';
import { toMealPlanItemSyncContext } from './meal-plan-entry-sync-context';
import { queryMealPlanItemSyncRow } from './query-meal-plan-entry-sync-rows';

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
  const { storeId, ...otherUpdates } = updates;
  const nullableUpdates = {
    ...(otherUpdates.notes !== undefined
      ? { notes: otherUpdates.notes || null }
      : {}),
    ...(otherUpdates.category !== undefined
      ? { category: otherUpdates.category || null }
      : {}),
    ...(otherUpdates.mealTag !== undefined
      ? { mealTag: otherUpdates.mealTag || null }
      : {}),
  };
  const now = new Date().toISOString();

  const row = await queryMealPlanItemSyncRow(mealPlanItemId);
  if (!row) {
    throw new Error('Meal plan item not found');
  }

  const transactions: TransactionChunk[] = [
    tx.meal_plan_items[mealPlanItemId].update(
      trimStringFields({
        ...otherUpdates,
        ...nullableUpdates,
        updatedAt: now,
      })
    ),
  ];

  const currentStoreId = row.store?.id;
  if (storeId !== undefined && storeId !== (currentStoreId ?? '')) {
    if (currentStoreId) {
      transactions.push(
        tx.meal_plan_items[mealPlanItemId].unlink({ store: currentStoreId })
      );
    }
    if (storeId) {
      transactions.push(
        tx.meal_plan_items[mealPlanItemId].link({ store: storeId })
      );
    }
  }

  const context = toMealPlanItemSyncContext(row);
  if (context) {
    transactions.push(
      ...buildMealPlanEntrySyncTransactions({
        context: {
          ...context,
          entry: applyMealPlanItemEdit(context.entry, {
            name: otherUpdates.name,
            quantity: otherUpdates.quantity,
            unit: otherUpdates.unit,
            notes: nullableUpdates.notes,
            category: nullableUpdates.category,
            storeId,
          }),
        },
        defaultStore,
        now,
      })
    );
  }

  await db.transact(transactions);
};
