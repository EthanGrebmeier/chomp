import { id, tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';
import {
  initializeMealPlanIngredientEditor,
  type MealPlanIngredientSnapshotCreateInput,
  toSnapshotCreateInputs,
} from '../meal-plan-recipe-ingredient-editor';

import { buildMealPlanListSyncTransactions } from './build-meal-plan-list-sync-transactions';
import { toNewMealPlanRecipeEntryForSync } from './new-meal-plan-entry-for-sync';
import {
  type MealPlanRecipeEntryForSync,
  planMealPlanListSync,
} from './plan-meal-plan-list-sync';

export type AddRecipeToDateArgs = {
  listId: string;
  recipeId: string;
  date: string;
  mealTag?: string;
  servings?: number;
  /** The recipe's current ingredients, used to project linked grocery items. */
  sourceIngredients: MealPlanRecipeEntryForSync['sourceIngredients'];
  /** Per-ingredient overrides; defaults to every ingredient selected as-is. */
  ingredientSnapshots?: MealPlanIngredientSnapshotCreateInput[];
  /** List default store, applied to linked items without a store. */
  defaultStore?: DefaultStoreForStacking | null;
};

/**
 * Adds a recipe to the meal plan and, in the same transaction, creates a
 * linked grocery item for each selected ingredient.
 */
export const addRecipeToDate = async ({
  listId,
  recipeId,
  date,
  mealTag,
  servings = 1,
  sourceIngredients,
  ingredientSnapshots = toSnapshotCreateInputs(
    initializeMealPlanIngredientEditor(sourceIngredients)
  ),
  defaultStore,
}: AddRecipeToDateArgs) => {
  const mealPlanRecipeId = id();
  const now = new Date().toISOString();
  const transactions: TransactionChunk[] = [
    tx.meal_plan_recipes[mealPlanRecipeId].update(
      trimStringFields({
        mealTag: mealTag,
        date: date,
        servings: servings,
        ignoredByGroceryList: false,
        // TODO(MPS-06): remove once the manual add-to-list flow is gone. Marks
        // the entry as added so that flow skips it and nothing is added twice.
        addedToList: true,
        addedToListAt: now,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.meal_plan_recipes[mealPlanRecipeId].link({
      grocery_list: listId,
      recipe: recipeId,
    }),
  ];

  const snapshotRows = ingredientSnapshots.map(snapshot => ({
    ...snapshot,
    id: id(),
  }));

  for (const snapshot of snapshotRows) {
    const snapshotId = snapshot.id;
    transactions.push(
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].update(
        trimStringFields({
          sourceRecipeIngredientId: snapshot.sourceRecipeIngredientId,
          name: snapshot.name,
          quantity: snapshot.quantity,
          unit: snapshot.unit,
          notes: snapshot.notes ?? null,
          category: snapshot.category ?? null,
          isSelected: snapshot.isSelected,
          isQuantityOverridden: snapshot.isQuantityOverridden,
        })
      ),
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
        meal_plan_recipe: mealPlanRecipeId,
      })
    );

    if (snapshot.storeId) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
          store: snapshot.storeId,
        })
      );
    }
  }

  const syncPlan = planMealPlanListSync({
    entry: toNewMealPlanRecipeEntryForSync({
      mealPlanRecipeId,
      recipeId,
      servings,
      sourceIngredients,
      snapshotRows,
    }),
    defaultStore,
  });
  transactions.push(
    ...buildMealPlanListSyncTransactions({ listId, plan: syncPlan, now })
  );

  await db.transact(transactions);

  return { id: mealPlanRecipeId };
};
