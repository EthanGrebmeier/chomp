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
