import type { StoreReviewer } from '@/features/quantity/app/store-review';

import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';
import {
  initializeMealPlanIngredientEditor,
  type MealPlanIngredientSnapshotCreateInput,
  toSnapshotCreateInputs,
} from '../meal-plan-recipe-ingredient-editor';

import { type MealPlanRecipeEntryForSync } from './plan-meal-plan-list-sync';

export type AddRecipeToDateArgs = {
  reviewConflicts?: StoreReviewer;
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
  reviewConflicts,
}: AddRecipeToDateArgs) => {
  const { planQuantityRecipe } =
    await import('@/features/quantity/app/meal-actions');
  return planQuantityRecipe({
    listId,
    recipeId,
    date,
    mealTag,
    servings,
    sourceIngredients,
    ingredientSnapshots,
    defaultStore,
    reviewConflicts,
  });
};
