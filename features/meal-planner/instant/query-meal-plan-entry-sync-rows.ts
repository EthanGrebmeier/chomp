import { db } from '../../../lib/instant';

import type {
  MealPlanItemSyncRow,
  MealPlanRecipeSyncRow,
} from './meal-plan-entry-sync-context';

/**
 * Loads a meal plan recipe with everything needed to sync its linked grocery
 * items: the recipe's ingredients and each snapshot row's linked item. Look it
 * up by its own id, or by the id of one of its snapshot rows.
 */
export const queryMealPlanRecipeSyncRow = async (
  lookup: { mealPlanRecipeId: string } | { snapshotRowId: string }
): Promise<MealPlanRecipeSyncRow | null> => {
  const where: { id: string } | { 'ingredient_snapshots.id': string } =
    'mealPlanRecipeId' in lookup
      ? { id: lookup.mealPlanRecipeId }
      : { 'ingredient_snapshots.id': lookup.snapshotRowId };
  const result = await db.queryOnce({
    meal_plan_recipes: {
      $: { where },
      grocery_list: {},
      recipe: {
        recipe_ingredients: {
          store: {},
        },
      },
      ingredient_snapshots: {
        store: {},
        grocery_item: {
          store: {},
        },
      },
    },
  });

  return (
    (result.data.meal_plan_recipes?.[0] as MealPlanRecipeSyncRow | undefined) ??
    null
  );
};

/**
 * Loads a standalone meal plan item with its store and linked grocery item.
 */
export const queryMealPlanItemSyncRow = async (
  mealPlanItemId: string
): Promise<MealPlanItemSyncRow | null> => {
  const result = await db.queryOnce({
    meal_plan_items: {
      $: { where: { id: mealPlanItemId } },
      grocery_list: {},
      store: {},
      grocery_item: {
        store: {},
      },
    },
  });

  return (
    (result.data.meal_plan_items?.[0] as MealPlanItemSyncRow | undefined) ??
    null
  );
};
