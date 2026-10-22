import type { MealPlanIngredientSnapshotCreateInput } from '../meal-plan-recipe-ingredient-editor';

import type {
  MealPlanItemEntryForSync,
  MealPlanRecipeEntryForSync,
} from './plan-meal-plan-list-sync';

type NewSnapshotRow = MealPlanIngredientSnapshotCreateInput & {
  /** Id the snapshot row is being created with. */
  id: string;
};

export type NewMealPlanRecipeEntryForSyncArgs = {
  mealPlanRecipeId: string;
  recipeId: string;
  servings: number;
  sourceIngredients: MealPlanRecipeEntryForSync['sourceIngredients'];
  snapshotRows: NewSnapshotRow[];
};

/**
 * Describes a meal plan recipe that is being created, in the shape
 * `planMealPlanListSync` expects. New entries are never ignored and have no
 * linked grocery items yet, so the sync plan creates one per selected
 * ingredient.
 */
export const toNewMealPlanRecipeEntryForSync = ({
  mealPlanRecipeId,
  recipeId,
  servings,
  sourceIngredients,
  snapshotRows,
}: NewMealPlanRecipeEntryForSyncArgs): MealPlanRecipeEntryForSync => ({
  kind: 'recipe',
  id: mealPlanRecipeId,
  recipeId,
  servings,
  ignoredByGroceryList: false,
  sourceIngredients,
  snapshotRows: snapshotRows.map(({ storeId, ...row }) => ({
    ...row,
    store: storeId ? { id: storeId } : null,
    grocery_item: null,
  })),
});

export type NewMealPlanItemEntryForSyncArgs = {
  mealPlanItemId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string | null;
};

/**
 * Describes a standalone meal plan item that is being created, in the shape
 * `planMealPlanListSync` expects, so the sync plan creates its linked item.
 */
export const toNewMealPlanItemEntryForSync = ({
  mealPlanItemId,
  storeId,
  ...fields
}: NewMealPlanItemEntryForSyncArgs): MealPlanItemEntryForSync => ({
  kind: 'item',
  id: mealPlanItemId,
  ignoredByGroceryList: false,
  ...fields,
  store: storeId ? { id: storeId } : null,
  grocery_item: null,
});
