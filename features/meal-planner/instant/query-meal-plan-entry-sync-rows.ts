import { db } from '../../../lib/instant';

import type {
  MealPlanItemSyncRow,
  MealPlanRecipeSyncRow,
} from './meal-plan-entry-sync-context';

type MemberRecipeWhere = {
  'grocery_list.shares.user_id': string;
} & ({ 'recipe.id': string } | { 'recipe.recipe_ingredients.id': string });

type LeaverRecipeWhere = {
  'grocery_list.id': string;
  'recipe.user.id': string;
};

const queryMealPlanRecipeSyncRowsWhere = async (
  where:
    | { id: string | { $in: string[] } }
    | { 'ingredient_snapshots.id': string }
    | MemberRecipeWhere
    | LeaverRecipeWhere,
  { withRecipeOwner = false }: { withRecipeOwner?: boolean } = {}
): Promise<MealPlanRecipeSyncRow[]> => {
  const result = await db.queryOnce({
    meal_plan_recipes: {
      $: { where },
      grocery_list: {},
      recipe: {
        recipe_ingredients: {
          store: {},
        },
        ...(withRecipeOwner ? { user: {} } : {}),
      },
      ingredient_snapshots: {
        store: {},
        grocery_item: {
          store: {},
        },
      },
    },
  });

  return (result.data.meal_plan_recipes ?? []) as MealPlanRecipeSyncRow[];
};

const queryMealPlanItemSyncRowsWhere = async (where: {
  id: string | { $in: string[] };
}): Promise<MealPlanItemSyncRow[]> => {
  const result = await db.queryOnce({
    meal_plan_items: {
      $: { where },
      grocery_list: {},
      store: {},
      grocery_item: {
        store: {},
      },
    },
  });

  return (result.data.meal_plan_items ?? []) as MealPlanItemSyncRow[];
};

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
  const [row] = await queryMealPlanRecipeSyncRowsWhere(where);

  return row ?? null;
};

/**
 * Loads several meal plan recipes and items in sync shape (see the single-row
 * queries above). Skips the query for an empty id list.
 */
export const queryMealPlanEntrySyncRows = async ({
  mealPlanRecipeIds,
  mealPlanItemIds,
}: {
  mealPlanRecipeIds: string[];
  mealPlanItemIds: string[];
}): Promise<{
  recipeRows: MealPlanRecipeSyncRow[];
  itemRows: MealPlanItemSyncRow[];
}> => {
  const [recipeRows, itemRows] = await Promise.all([
    mealPlanRecipeIds.length > 0
      ? queryMealPlanRecipeSyncRowsWhere({ id: { $in: mealPlanRecipeIds } })
      : [],
    mealPlanItemIds.length > 0
      ? queryMealPlanItemSyncRowsWhere({ id: { $in: mealPlanItemIds } })
      : [],
  ]);

  return { recipeRows, itemRows };
};

/**
 * Loads, in sync shape, every meal plan recipe that uses a recipe (looked up
 * by the recipe's id or one of its ingredients' ids) on lists the user is a
 * member of. Lists the user has left or never joined are never returned.
 */
export const queryMemberMealPlanRecipeSyncRows = async ({
  userId,
  lookup,
}: {
  userId: string;
  lookup: { recipeId: string } | { recipeIngredientId: string };
}): Promise<MealPlanRecipeSyncRow[]> =>
  queryMealPlanRecipeSyncRowsWhere({
    'grocery_list.shares.user_id': userId,
    ...('recipeId' in lookup
      ? { 'recipe.id': lookup.recipeId }
      : { 'recipe.recipe_ingredients.id': lookup.recipeIngredientId }),
  });

/**
 * Loads, in sync shape and with each recipe's owner, the meal plan recipes on
 * a list that use recipes owned by the user. Used to clean up before the user
 * leaves the list, while permissions still let them see and delete the rows.
 */
export const queryLeaverMealPlanRecipeSyncRows = async ({
  userId,
  listId,
}: {
  userId: string;
  listId: string;
}): Promise<MealPlanRecipeSyncRow[]> =>
  queryMealPlanRecipeSyncRowsWhere(
    { 'grocery_list.id': listId, 'recipe.user.id': userId },
    { withRecipeOwner: true }
  );

/**
 * Loads a standalone meal plan item with its store and linked grocery item.
 */
export const queryMealPlanItemSyncRow = async (
  mealPlanItemId: string
): Promise<MealPlanItemSyncRow | null> => {
  const [row] = await queryMealPlanItemSyncRowsWhere({ id: mealPlanItemId });

  return row ?? null;
};
