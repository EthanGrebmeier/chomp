import { id, tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

import type { MealPlanEntrySyncContext } from './meal-plan-entry-sync-context';
import {
  type MealPlanEntryForSync,
  type MealPlanListSyncPlan,
  type MealPlanListSyncSource,
  planMealPlanListSync,
} from './plan-meal-plan-list-sync';

type BuildMealPlanListSyncTransactionsArgs = {
  /** Grocery list the meal plan belongs to; new linked items are added here. */
  listId: string;
  plan: MealPlanListSyncPlan;
  now?: string;
};

const sourceLink = (source: MealPlanListSyncSource) =>
  source.type === 'snapshot'
    ? { meal_plan_ingredient_snapshot: source.snapshotId }
    : { meal_plan_item: source.mealPlanItemId };

/**
 * Turns a `planMealPlanListSync` plan into transaction chunks so callers can
 * write them in the same `db.transact` as their meal plan mutation.
 *
 * Linked items are one-to-one with their source: they are always created as
 * their own row (never stacked) and do not log `grocery_item_add_events`,
 * since they are not a user's manual add. Deletes are hard deletes so the
 * source can be re-added later; a soft-deleted linked item would count as
 * present and block that.
 */
export const buildMealPlanListSyncTransactions = ({
  listId,
  plan,
  now = new Date().toISOString(),
}: BuildMealPlanListSyncTransactionsArgs): TransactionChunk[] => {
  const transactions: TransactionChunk[] = [];

  for (const { source, fields, recipeId } of plan.creates) {
    const itemId = id();
    const { storeId, ...itemFields } = fields;
    transactions.push(
      tx.grocery_items[itemId].update({
        ...itemFields,
        isChecked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      }),
      tx.grocery_items[itemId].link({ grocery_list: listId }),
      tx.grocery_items[itemId].link(sourceLink(source))
    );
    if (storeId) {
      transactions.push(tx.grocery_items[itemId].link({ store: storeId }));
    }
    if (recipeId) {
      transactions.push(tx.grocery_items[itemId].link({ recipe: recipeId }));
    }
  }

  for (const { groceryItemId, fields, previousStoreId } of plan.updates) {
    const { storeId, ...itemFields } = fields;
    transactions.push(
      tx.grocery_items[groceryItemId].update({ ...itemFields, updatedAt: now })
    );
    if (storeId !== previousStoreId) {
      if (previousStoreId) {
        transactions.push(
          tx.grocery_items[groceryItemId].unlink({ store: previousStoreId })
        );
      }
      if (storeId) {
        transactions.push(
          tx.grocery_items[groceryItemId].link({ store: storeId })
        );
      }
    }
  }

  for (const { groceryItemId } of plan.deletes) {
    transactions.push(tx.grocery_items[groceryItemId].delete());
  }

  for (const { source, groceryItemId } of plan.unlinks) {
    transactions.push(
      tx.grocery_items[groceryItemId].unlink(sourceLink(source))
    );
  }

  return transactions;
};

export type BuildMealPlanEntrySyncTransactionsArgs = {
  context: MealPlanEntrySyncContext<MealPlanEntryForSync>;
  /** True when the entry (or, for a recipe swap, its old snapshots) goes away. */
  isRemoved?: boolean;
  /** List default store, applied to linked items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
  now?: string;
};

/**
 * Plans and builds the grocery item writes that bring one meal plan entry's
 * linked items in line with its (already updated, in-memory) state, so callers
 * can append them to the `db.transact` of their meal plan mutation.
 */
export const buildMealPlanEntrySyncTransactions = ({
  context,
  isRemoved,
  defaultStore,
  now,
}: BuildMealPlanEntrySyncTransactionsArgs): TransactionChunk[] =>
  buildMealPlanListSyncTransactions({
    listId: context.listId,
    plan: planMealPlanListSync({
      entry: context.entry,
      isRemoved,
      defaultStore,
    }),
    now,
  });
