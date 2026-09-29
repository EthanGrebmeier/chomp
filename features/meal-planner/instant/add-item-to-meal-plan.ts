import { id, tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';
import { addSavedItemIfNotExists } from '../../saved-items/instant/add-saved-item-if-not-exists';

import { buildMealPlanListSyncTransactions } from './build-meal-plan-list-sync-transactions';
import { toNewMealPlanItemEntryForSync } from './new-meal-plan-entry-for-sync';
import { planMealPlanListSync } from './plan-meal-plan-list-sync';

export type AddItemToDateArgs = {
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string;
  storeId?: string;
  date: string;
  mealTag?: string;
  /** List default store, applied to the linked item when it has no store. */
  defaultStore?: DefaultStoreForStacking | null;
};

/**
 * Adds a standalone item to the meal plan and, in the same transaction,
 * creates its linked grocery item.
 */
export const addItemToDate = async ({
  listId,
  name,
  quantity,
  unit,
  notes,
  category,
  storeId,
  date,
  mealTag,
  defaultStore,
}: AddItemToDateArgs) => {
  const mealPlanItemId = id();
  const now = new Date().toISOString();

  const transactions: TransactionChunk[] = [
    tx.meal_plan_items[mealPlanItemId].update(
      trimStringFields({
        name,
        quantity,
        unit,
        notes,
        category,
        mealTag,
        date,
        ignoredByGroceryList: false,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.meal_plan_items[mealPlanItemId].link({
      grocery_list: listId,
    }),
  ];

  // Add store link if provided
  if (storeId) {
    transactions.push(
      tx.meal_plan_items[mealPlanItemId].link({
        store: storeId,
      })
    );
  }

  const syncPlan = planMealPlanListSync({
    entry: toNewMealPlanItemEntryForSync({
      mealPlanItemId,
      name,
      quantity,
      unit,
      notes,
      category,
      storeId,
    }),
    defaultStore,
  });
  transactions.push(
    ...buildMealPlanListSyncTransactions({ listId, plan: syncPlan, now })
  );

  await db.transact(transactions);

  addSavedItemIfNotExists({
    name,
    category,
  });

  return { id: mealPlanItemId };
};
