import type { StackableIngredientInput } from '../../recipes/instant/stack-recipe-ingredients-plan';

import { isMealPlanEntryAddable } from '../utils/meal-plan-addable-window';

import {
  MealPlanToListProjectionInput,
  projectMealPlanRecipeToListInputs,
} from './meal-plan-to-list-projection';
import {
  MealPlanSnapshotReconciliationPlan,
  planMealPlanSnapshotReconciliation,
} from './plan-meal-plan-snapshot-reconciliation';

type SourceIngredient =
  MealPlanToListProjectionInput['sourceIngredients'][number];
type SnapshotRow = MealPlanToListProjectionInput['snapshotRows'][number] & {
  id: string;
};

export type MealPlanRecipeForAdd = {
  id: string;
  date: string;
  addedToList?: boolean | null;
  servings?: number | null;
  recipe?: {
    id: string;
    recipe_ingredients?: SourceIngredient[];
    user?: { id: string } | null;
  } | null;
  ingredient_snapshots?: SnapshotRow[];
};

export type MealPlanItemForAdd = {
  id: string;
  date: string;
  addedToList?: boolean | null;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  store?: { id: string; name?: string | null } | null;
};

export type AddMealsSelection = {
  /** Recipe IDs to add ingredients for. If omitted, all unadded recipes are added. */
  selectedRecipeIds?: string[];
  /** Recipe IDs to mark as added without creating grocery items. */
  skippedRecipeIds?: string[];
  /** Item IDs to add. If omitted, all unadded items are added. */
  selectedItemIds?: string[];
  /** Item IDs to mark as added without creating grocery items. */
  skippedItemIds?: string[];
};

type PlanAddMealsToGroceryListArgs = AddMealsSelection & {
  recipes: readonly MealPlanRecipeForAdd[];
  items: readonly MealPlanItemForAdd[];
  userId?: string;
  referenceDate?: Date;
};

export type AddMealsToGroceryListPlan = {
  ingredientsToAdd: StackableIngredientInput[];
  /** Meal plan recipes and items to flag as added (selected and skipped). */
  recipeIdsToMarkAdded: string[];
  itemIdsToMarkAdded: string[];
  /** Recipes owned by the user whose `lastAddedToListAt` should be bumped. */
  ownedRecipeIdsAdded: string[];
  snapshotReconciliations: {
    mealPlanRecipeId: string;
    plan: MealPlanSnapshotReconciliationPlan;
  }[];
  addedRecipeCount: number;
  addedItemCount: number;
};

const partitionUnadded = <T extends { id: string }>(
  unadded: T[],
  selectedIds: string[] | undefined,
  skippedIds: string[] | undefined
) => {
  const selected = selectedIds ? new Set(selectedIds) : null;
  const skipped = new Set(skippedIds ?? []);

  return {
    toAdd: selected ? unadded.filter(entry => selected.has(entry.id)) : unadded,
    toSkip: unadded.filter(entry => skipped.has(entry.id)),
  };
};

/**
 * Plans adding meal plan entries to a grocery list from already-loaded data.
 * Entries already added or older than the addable window are ignored.
 */
export const planAddMealsToGroceryList = ({
  recipes,
  items,
  userId,
  selectedRecipeIds,
  skippedRecipeIds,
  selectedItemIds,
  skippedItemIds,
  referenceDate = new Date(),
}: PlanAddMealsToGroceryListArgs): AddMealsToGroceryListPlan => {
  const isUnadded = (entry: { addedToList?: boolean | null; date: string }) =>
    !entry.addedToList && isMealPlanEntryAddable(entry.date, referenceDate);

  const recipePartition = partitionUnadded(
    recipes.filter(isUnadded),
    selectedRecipeIds,
    skippedRecipeIds
  );
  const itemPartition = partitionUnadded(
    items.filter(isUnadded),
    selectedItemIds,
    skippedItemIds
  );

  const plan: AddMealsToGroceryListPlan = {
    ingredientsToAdd: [],
    recipeIdsToMarkAdded: recipePartition.toSkip.map(entry => entry.id),
    itemIdsToMarkAdded: itemPartition.toSkip.map(entry => entry.id),
    ownedRecipeIdsAdded: [],
    snapshotReconciliations: [],
    addedRecipeCount: recipePartition.toAdd.length,
    addedItemCount: itemPartition.toAdd.length,
  };

  for (const mealPlanRecipe of recipePartition.toAdd) {
    const recipe = mealPlanRecipe.recipe;
    if (!recipe) continue;

    const sourceIngredients = recipe.recipe_ingredients ?? [];
    const snapshotRows = mealPlanRecipe.ingredient_snapshots ?? [];

    // Projection falls back to source-ingredient defaults for any source
    // ingredient missing a snapshot row and ignores orphaned rows, so raw
    // snapshot rows produce the same output as freshly reconciled rows.
    plan.ingredientsToAdd.push(
      ...projectMealPlanRecipeToListInputs({
        recipeId: recipe.id,
        servings: mealPlanRecipe.servings || 1,
        sourceIngredients,
        snapshotRows,
      })
    );

    // Keep the snapshot table consistent (legacy backfill + reconciliation).
    plan.snapshotReconciliations.push({
      mealPlanRecipeId: mealPlanRecipe.id,
      plan: planMealPlanSnapshotReconciliation({
        sourceIngredients,
        existingSnapshotRows: snapshotRows,
      }),
    });

    plan.recipeIdsToMarkAdded.push(mealPlanRecipe.id);

    if (userId && recipe.user?.id === userId) {
      plan.ownedRecipeIdsAdded.push(recipe.id);
    }
  }

  for (const mealPlanItem of itemPartition.toAdd) {
    plan.ingredientsToAdd.push({
      name: mealPlanItem.name,
      quantity: mealPlanItem.quantity,
      unit: mealPlanItem.unit,
      notes: mealPlanItem.notes,
      category: mealPlanItem.category,
      storeName: mealPlanItem.store?.name,
      storeId: mealPlanItem.store?.id,
    });
    plan.itemIdsToMarkAdded.push(mealPlanItem.id);
  }

  return plan;
};
