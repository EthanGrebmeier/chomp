import { id, tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';
import {
  initializeMealPlanIngredientEditor,
  toSnapshotCreateInputs,
} from '../meal-plan-recipe-ingredient-editor';

import { buildSnapshotRowCreateTransactions } from './build-snapshot-row-create-transactions';
import { buildMealPlanEntrySyncTransactions } from './build-meal-plan-list-sync-transactions';
import { toMealPlanRecipeSyncContext } from './meal-plan-entry-sync-context';
import { queryMealPlanRecipeSyncRow } from './query-meal-plan-entry-sync-rows';
import { toNewMealPlanRecipeEntryForSync } from './new-meal-plan-entry-for-sync';
import type { MealPlanRecipeEntryForSync } from './plan-meal-plan-list-sync';

export type UpdateMealPlanRecipeArgs = {
  mealPlanRecipeId: string;
  updates: {
    mealTag?: string;
    servings?: number;
    order?: number;
    recipeId?: string;
    date?: string;
  };
  /** List default store, applied to linked items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
};

const queryRecipeIngredients = async (
  recipeId: string
): Promise<MealPlanRecipeEntryForSync['sourceIngredients']> => {
  const result = await db.queryOnce({
    recipes: {
      $: { where: { id: recipeId } },
      recipe_ingredients: {
        store: {},
      },
    },
  });
  const recipe = result.data.recipes?.[0];
  if (!recipe) {
    throw new Error('Recipe not found');
  }

  return recipe.recipe_ingredients ?? [];
};

/**
 * Updates a meal plan recipe and, in the same transaction, its linked
 * unchecked grocery items:
 *
 * - servings changes re-project quantities that aren't overridden;
 * - date and meal tag changes leave the items as they are, but still go
 *   through the sync planner so there is one code path;
 * - swapping the recipe replaces the ingredient snapshots with the new
 *   recipe's ingredients (all selected), so the old unchecked items are
 *   deleted, checked ones are unlinked, and new ones are created.
 */
export const updateMealPlanRecipe = async ({
  mealPlanRecipeId,
  updates,
  defaultStore,
}: UpdateMealPlanRecipeArgs) => {
  const { recipeId, ...otherUpdates } = updates;
  const mealTagUpdate =
    otherUpdates.mealTag !== undefined
      ? { mealTag: otherUpdates.mealTag || null }
      : {};
  const now = new Date().toISOString();

  const row = await queryMealPlanRecipeSyncRow({ mealPlanRecipeId });
  if (!row) {
    throw new Error('Meal plan recipe not found');
  }

  const transactions: TransactionChunk[] = [
    tx.meal_plan_recipes[mealPlanRecipeId].update(
      trimStringFields({
        ...otherUpdates,
        ...mealTagUpdate,
        updatedAt: now,
      })
    ),
  ];

  const context = toMealPlanRecipeSyncContext(row);
  const servings = otherUpdates.servings ?? row.servings;
  const isSwappingRecipe =
    recipeId !== undefined && recipeId !== row.recipe?.id;

  if (!isSwappingRecipe) {
    if (context) {
      transactions.push(
        ...buildMealPlanEntrySyncTransactions({
          context: { ...context, entry: { ...context.entry, servings } },
          defaultStore,
          now,
        })
      );
    }

    await db.transact(transactions);
    return;
  }

  const sourceIngredients = await queryRecipeIngredients(recipeId);
  const snapshotRows = toSnapshotCreateInputs(
    initializeMealPlanIngredientEditor(sourceIngredients)
  ).map(snapshot => ({ ...snapshot, id: id() }));

  transactions.push(
    tx.meal_plan_recipes[mealPlanRecipeId].link({ recipe: recipeId })
  );

  // The old snapshots go away with the old recipe: their unchecked items are
  // deleted and checked ones keep only their recipe link.
  if (context) {
    transactions.push(
      ...buildMealPlanEntrySyncTransactions({
        context,
        isRemoved: true,
        defaultStore,
        now,
      })
    );
  }
  for (const snapshot of row.ingredient_snapshots ?? []) {
    transactions.push(
      tx.meal_plan_recipe_ingredient_snapshots[snapshot.id].delete()
    );
  }

  transactions.push(
    ...buildSnapshotRowCreateTransactions({
      mealPlanRecipeId,
      rows: snapshotRows,
    })
  );

  const listId = row.grocery_list?.id;
  if (listId) {
    transactions.push(
      ...buildMealPlanEntrySyncTransactions({
        context: {
          listId,
          entry: {
            ...toNewMealPlanRecipeEntryForSync({
              mealPlanRecipeId,
              recipeId,
              servings: servings ?? 1,
              sourceIngredients,
              snapshotRows,
            }),
            // Swapping the recipe keeps the entry's "meal plan only" choice.
            ignoredByGroceryList: row.ignoredByGroceryList,
          },
        },
        defaultStore,
        now,
      })
    );
  }

  await db.transact(transactions);
};
