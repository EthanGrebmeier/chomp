import { tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';

import { buildLinkedItemDetachTransactions } from './build-meal-plan-list-sync-transactions';
import type {
  MealPlanItemSyncRow,
  MealPlanRecipeSyncRow,
} from './meal-plan-entry-sync-context';
import {
  type MealPlanEntryForSync,
  type MealPlanListSyncPlan,
  planMealPlanListSync,
} from './plan-meal-plan-list-sync';

/**
 * Maps a `meal_plan_recipes` row to its sync shape for removal. Unlike
 * `toMealPlanRecipeSyncContext` this never gives up on a missing list or
 * recipe: removing an entry only deletes or unlinks existing linked items,
 * which needs neither.
 */
const toRemovedRecipeEntry = (
  row: MealPlanRecipeSyncRow
): MealPlanEntryForSync => ({
  kind: 'recipe',
  id: row.id,
  recipeId: row.recipe?.id ?? '',
  servings: row.servings,
  ignoredByGroceryList: row.ignoredByGroceryList,
  sourceIngredients: row.recipe?.recipe_ingredients ?? [],
  snapshotRows: (row.ingredient_snapshots ?? []).map(snapshot => ({
    ...snapshot,
    store: snapshot.store ?? null,
    grocery_item: snapshot.grocery_item ?? null,
  })),
});

const toRemovedItemEntry = ({
  grocery_list: _groceryList,
  store,
  grocery_item,
  ...item
}: MealPlanItemSyncRow): MealPlanEntryForSync => ({
  ...item,
  kind: 'item',
  store: store ?? null,
  grocery_item: grocery_item ?? null,
});

export type MealPlanEntryRemovalPlan = Pick<
  MealPlanListSyncPlan,
  'deletes' | 'unlinks'
>;

export type PlanMealPlanEntryRemovalArgs = {
  recipeRows?: MealPlanRecipeSyncRow[];
  itemRows?: MealPlanItemSyncRow[];
};

/**
 * Plans the grocery item side of deleting meal plan entries (Delete Meal,
 * Delete Item, Clear Meal Plan): their unchecked linked items are removed from
 * the list, and checked or soft-deleted ones are kept as history and only lose
 * their meal plan link (a recipe item keeps its `recipe` link).
 *
 * Pure and tx-free.
 */
export const planMealPlanEntryRemoval = ({
  recipeRows = [],
  itemRows = [],
}: PlanMealPlanEntryRemovalArgs): MealPlanEntryRemovalPlan => {
  const entries = [
    ...recipeRows.map(toRemovedRecipeEntry),
    ...itemRows.map(toRemovedItemEntry),
  ];
  const plan: MealPlanEntryRemovalPlan = { deletes: [], unlinks: [] };

  for (const entry of entries) {
    const entryPlan = planMealPlanListSync({ entry, isRemoved: true });
    plan.deletes.push(...entryPlan.deletes);
    plan.unlinks.push(...entryPlan.unlinks);
  }

  return plan;
};

/**
 * Builds one transaction that deletes the given meal plan entries together
 * with their linked grocery item changes (see `planMealPlanEntryRemoval`).
 */
export const buildMealPlanEntryRemovalTransactions = ({
  recipeRows = [],
  itemRows = [],
}: PlanMealPlanEntryRemovalArgs): TransactionChunk[] => [
  ...buildLinkedItemDetachTransactions(
    planMealPlanEntryRemoval({ recipeRows, itemRows })
  ),
  ...recipeRows.map(row => tx.meal_plan_recipes[row.id].delete()),
  ...itemRows.map(row => tx.meal_plan_items[row.id].delete()),
];
