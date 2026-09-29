import { id } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

import { buildRecipeIngredientEditPropagationTransactions } from './build-recipe-ingredient-edit-propagation-transactions';
import type { MealPlanRecipeSyncRow } from './meal-plan-entry-sync-context';
import {
  planRecipeIngredientEditPropagation,
  type RecipeIngredientEdit,
} from './plan-recipe-ingredient-edit-propagation';
import { queryMemberMealPlanRecipeSyncRows } from './query-meal-plan-entry-sync-rows';

export type RecipeIngredientEditLookup =
  | { recipeId: string }
  | { recipeIngredientId: string };

/**
 * Loads the planned meals that use a recipe on lists the signed-in user is a
 * member of, before the edit is written. Returns an empty list when signed
 * out, or when the query fails (e.g. offline): the recipe edit itself must
 * still go through, and the list reconciler backfills added and removed
 * ingredients later.
 */
export const queryRecipeIngredientEditTargets = async (
  lookup: RecipeIngredientEditLookup
): Promise<MealPlanRecipeSyncRow[]> => {
  const user = await db.getAuth();
  if (!user) {
    return [];
  }

  try {
    return await queryMemberMealPlanRecipeSyncRows({ userId: user.id, lookup });
  } catch (error) {
    console.warn('Could not load planned meals for a recipe edit', error);
    return [];
  }
};

/**
 * Builds the writes that carry a recipe ingredient edit to the planned meals
 * loaded by `queryRecipeIngredientEditTargets` and their linked grocery
 * items, for the recipe edit's own `db.transact`.
 */
export const buildRecipeIngredientEditTransactions = ({
  recipeRows,
  edit,
  defaultStore,
}: {
  recipeRows: MealPlanRecipeSyncRow[];
  edit: RecipeIngredientEdit;
  /** List default store, applied to linked items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
}): TransactionChunk[] =>
  buildRecipeIngredientEditPropagationTransactions({
    plans: planRecipeIngredientEditPropagation({
      recipeRows,
      edit,
      defaultStore,
      createId: id,
    }),
  });
