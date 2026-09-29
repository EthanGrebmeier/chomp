import { id, tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import {
  buildIngredientStackingTransactions,
  DefaultStoreForStacking,
  ExistingIngredientForStacking,
  fetchExistingIngredientsForStacking,
} from '../../recipes/instant/stack-recipe-ingredients';

import {
  AddMealsSelection,
  MealPlanItemForAdd,
  MealPlanRecipeForAdd,
  planAddMealsToGroceryList,
} from './plan-add-meals-to-grocery-list';
import {
  MealPlanSnapshotReconciliationPlan,
  SnapshotRowToCreate,
} from './plan-meal-plan-snapshot-reconciliation';

const buildSnapshotReconciliationTransactions = (
  mealPlanRecipeId: string,
  { rowsToCreate, rowIdsToDelete }: MealPlanSnapshotReconciliationPlan
): TransactionChunk[] => {
  const transactions: TransactionChunk[] = [];

  for (const rowId of rowIdsToDelete) {
    transactions.push(tx.meal_plan_recipe_ingredient_snapshots[rowId].delete());
  }

  for (const row of rowsToCreate) {
    const snapshotId = id();
    const { storeId, ...fields }: SnapshotRowToCreate = row;
    transactions.push(
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].update(
        trimStringFields(fields)
      ),
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
        meal_plan_recipe: mealPlanRecipeId,
      })
    );

    if (storeId) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
          store: storeId,
        })
      );
    }
  }

  return transactions;
};

export type AddMealsToGroceryListArgs = AddMealsSelection & {
  listId: string;
  /** Live meal plan entries for `listId` (e.g. from `useUserMealPlanData`). */
  recipes: readonly MealPlanRecipeForAdd[];
  items: readonly MealPlanItemForAdd[];
  /**
   * Live, non-deleted items on `listId`. When omitted (e.g. the list
   * subscription has not loaded yet) they are fetched from the server.
   */
  existingItems?: ExistingIngredientForStacking[];
  defaultStore?: DefaultStoreForStacking | null;
  userId?: string;
};

/**
 * Adds meal plan entries to a grocery list in a single transaction.
 *
 * Works from data the caller already has loaded so the write (and InstantDB's
 * optimistic update) happens immediately, without a server round trip.
 */
export const addMealsToGroceryList = async ({
  listId,
  recipes,
  items,
  existingItems,
  defaultStore,
  userId,
  ...selection
}: AddMealsToGroceryListArgs) => {
  const plan = planAddMealsToGroceryList({
    recipes,
    items,
    userId,
    ...selection,
  });

  const now = new Date().toISOString();
  const transactions: TransactionChunk[] = [];

  if (plan.ingredientsToAdd.length > 0) {
    const stacking = buildIngredientStackingTransactions({
      listId,
      ingredients: plan.ingredientsToAdd,
      existingItems:
        existingItems ?? (await fetchExistingIngredientsForStacking(listId)),
      defaultStore,
      // Meal-plan bulk add is a single action; create separate items on metadata conflicts.
      conflictResolution: 'separate',
      now,
    });
    transactions.push(...stacking.transactions);
  }

  for (const {
    mealPlanRecipeId,
    plan: reconciliation,
  } of plan.snapshotReconciliations) {
    transactions.push(
      ...buildSnapshotReconciliationTransactions(
        mealPlanRecipeId,
        reconciliation
      )
    );
  }

  const markAdded = { addedToList: true, addedToListAt: now, updatedAt: now };
  for (const mealPlanRecipeId of plan.recipeIdsToMarkAdded) {
    transactions.push(tx.meal_plan_recipes[mealPlanRecipeId].update(markAdded));
  }
  for (const mealPlanItemId of plan.itemIdsToMarkAdded) {
    transactions.push(tx.meal_plan_items[mealPlanItemId].update(markAdded));
  }
  for (const recipeId of plan.ownedRecipeIdsAdded) {
    transactions.push(tx.recipes[recipeId].update({ lastAddedToListAt: now }));
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  return {
    addedRecipes: plan.addedRecipeCount,
    addedItems: plan.addedItemCount,
  };
};
