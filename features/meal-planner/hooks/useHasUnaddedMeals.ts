import { db } from '../../../lib/instant';
import { hasUnaddedMealPlanEntries } from '../utils/has-unadded-meal-plan-entries';

/**
 * Lightweight subscription that only answers "does this list's meal plan have
 * anything not yet added?". Used for the Meal Plan tab indicator so the
 * grocery-list view does not have to mount the full meal plan query.
 */
export const useHasUnaddedMeals = (listId: string | undefined): boolean => {
  const unaddedInList = listId
    ? { where: { 'grocery_list.id': listId, addedToList: false } }
    : null;

  const { data } = db.useQuery(
    unaddedInList
      ? {
          meal_plan_recipes: { $: unaddedInList, recipe: {} },
          meal_plan_items: { $: unaddedInList },
        }
      : null
  );

  if (!data) {
    return false;
  }

  return hasUnaddedMealPlanEntries({
    recipes: data.meal_plan_recipes,
    items: data.meal_plan_items,
  });
};
