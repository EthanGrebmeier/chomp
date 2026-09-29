import { tx } from '@instantdb/react-native';

import type { TransactionChunk } from '../../../lib/instant';

import {
  buildMealPlanEntryRemovalTransactions,
  type MealPlanEntryRemovalPlan,
  planMealPlanEntryRemoval,
} from './build-meal-plan-entry-removal-transactions';
import type { MealPlanRecipeSyncRow } from './meal-plan-entry-sync-context';

export type RecipeDeleteCascadePlan = MealPlanEntryRemovalPlan & {
  /** Planned meals that use the recipe and are deleted with it. */
  mealPlanRecipeIds: string[];
};

export type PlanRecipeDeleteCascadeArgs = {
  recipeId: string;
  /** Planned meals loaded for the recipe (rows using another recipe are ignored). */
  recipeRows: MealPlanRecipeSyncRow[];
};

const rowsUsingRecipe = ({
  recipeId,
  recipeRows,
}: PlanRecipeDeleteCascadeArgs) =>
  recipeRows.filter(row => row.recipe?.id === recipeId);

/**
 * Plans what deleting a recipe does to the meal plan: every planned meal that
 * uses it is deleted (its snapshot rows cascade with it), its unchecked linked
 * grocery items are removed, and its checked or soft-deleted ones only lose
 * their meal plan link. Their `recipe` link goes away with the recipe, so they
 * are left as plain items.
 *
 * Pure and tx-free.
 */
export const planRecipeDeleteCascade = (
  args: PlanRecipeDeleteCascadeArgs
): RecipeDeleteCascadePlan => {
  const recipeRows = rowsUsingRecipe(args);

  return {
    mealPlanRecipeIds: recipeRows.map(row => row.id),
    ...planMealPlanEntryRemoval({ recipeRows }),
  };
};

/**
 * Builds one transaction that deletes a recipe together with its planned
 * meals and their linked grocery item changes (see `planRecipeDeleteCascade`).
 */
export const buildRecipeDeleteCascadeTransactions = (
  args: PlanRecipeDeleteCascadeArgs
): TransactionChunk[] => [
  ...buildMealPlanEntryRemovalTransactions({
    recipeRows: rowsUsingRecipe(args),
  }),
  tx.recipes[args.recipeId].delete(),
];
