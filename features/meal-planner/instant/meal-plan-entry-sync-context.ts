import type {
  LinkedGroceryItemForSync,
  MealPlanEntryForSync,
  MealPlanItemEntryForSync,
  MealPlanRecipeEntryForSync,
  MealPlanSnapshotRowForSync,
} from './plan-meal-plan-list-sync';

type StoreRef = { id: string; name?: string | null } | null | undefined;

/** A `meal_plan_recipes` row as loaded by `queryMealPlanRecipeSyncRow`. */
export type MealPlanRecipeSyncRow = {
  id: string;
  servings?: number | null;
  ignoredByGroceryList?: boolean | null;
  grocery_list?: { id: string } | null;
  recipe?: {
    id: string;
    recipe_ingredients?: MealPlanRecipeEntryForSync['sourceIngredients'];
    /** The recipe's owner; only loaded by `queryLeaverMealPlanRecipeSyncRows`. */
    user?: { id: string } | null;
  } | null;
  ingredient_snapshots?: (Omit<
    MealPlanSnapshotRowForSync,
    'store' | 'grocery_item'
  > & {
    store?: StoreRef;
    grocery_item?: LinkedGroceryItemForSync | null;
  })[];
};

/** A `meal_plan_items` row as loaded by `queryMealPlanItemSyncRow`. */
export type MealPlanItemSyncRow = Omit<
  MealPlanItemEntryForSync,
  'kind' | 'store' | 'grocery_item'
> & {
  store?: StoreRef;
  grocery_list?: { id: string } | null;
  grocery_item?: LinkedGroceryItemForSync | null;
};

/** A meal plan entry in sync shape, plus the list its linked items live on. */
export type MealPlanEntrySyncContext<Entry extends MealPlanEntryForSync> = {
  listId: string;
  entry: Entry;
};

/**
 * Maps a loaded `meal_plan_recipes` row to the shape `planMealPlanListSync`
 * expects. Returns null when the row has no list or recipe, since its linked
 * items can't be projected then.
 */
export const toMealPlanRecipeSyncContext = (
  row: MealPlanRecipeSyncRow
): MealPlanEntrySyncContext<MealPlanRecipeEntryForSync> | null => {
  const listId = row.grocery_list?.id;
  const recipe = row.recipe;
  if (!listId || !recipe) {
    return null;
  }

  return {
    listId,
    entry: {
      kind: 'recipe',
      id: row.id,
      recipeId: recipe.id,
      servings: row.servings,
      ignoredByGroceryList: row.ignoredByGroceryList,
      sourceIngredients: recipe.recipe_ingredients ?? [],
      snapshotRows: (row.ingredient_snapshots ?? []).map(snapshot => ({
        ...snapshot,
        store: snapshot.store ?? null,
        grocery_item: snapshot.grocery_item ?? null,
      })),
    },
  };
};

/**
 * Maps a loaded `meal_plan_items` row to the shape `planMealPlanListSync`
 * expects. Returns null when the row has no list.
 */
export const toMealPlanItemSyncContext = ({
  grocery_list,
  store,
  grocery_item,
  ...item
}: MealPlanItemSyncRow): MealPlanEntrySyncContext<MealPlanItemEntryForSync> | null => {
  const listId = grocery_list?.id;
  if (!listId) {
    return null;
  }

  return {
    listId,
    entry: {
      ...item,
      kind: 'item',
      store: store ?? null,
      grocery_item: grocery_item ?? null,
    },
  };
};
