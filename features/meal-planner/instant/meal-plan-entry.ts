import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

/** Which kind of meal plan entry: a `meal_plan_recipes` or `meal_plan_items` row. */
export type MealPlanEntryType = 'recipe' | 'item';

/** Points at one meal plan entry, recipe or standalone item. */
export type MealPlanEntryRef = {
  type: MealPlanEntryType;
  /** `meal_plan_recipes` or `meal_plan_items` id, per `type`. */
  id: string;
};

/**
 * True when the entry is "meal plan only": it stays on the meal plan but is
 * kept off the grocery list. Works for recipes and items alike.
 */
export const isMealPlanOnly = (entry: {
  ignoredByGroceryList?: boolean | null;
}): boolean => entry.ignoredByGroceryList === true;

export type SetMealPlanEntryIgnoredArgs = MealPlanEntryRef & {
  ignored: boolean;
  /** List default store, applied to re-created linked items without a store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
};

/** Changes meal selection through the quantity model, preserving purchased history. */
export const setMealPlanEntryIgnored = async ({
  id: entryId,
  ignored,
}: SetMealPlanEntryIgnoredArgs) => {
  const { setQuantityMealIgnored } =
    await import('@/features/quantity/app/meal-actions');
  return setQuantityMealIgnored(entryId, ignored);
};
