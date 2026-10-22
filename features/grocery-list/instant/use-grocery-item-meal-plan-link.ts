import { db } from '../../../lib/instant';
import {
  GroceryItemMealPlanLink,
  GroceryItemWithMealPlanSource,
  resolveGroceryItemMealPlanLink,
} from '../meal-plan-link';

/**
 * Live meal plan link for the grocery item shown in the edit item sheet:
 * snapshot → meal plan recipe → recipe/date, or meal plan item → date.
 *
 * Queried per item rather than on every list row, because only the sheet
 * needs the planned recipe. Being live, the sentence disappears if the meal
 * plan entry is deleted while the sheet is open. Until the query resolves,
 * the link is read from the presented list row (which carries the snapshot's
 * meal plan recipe and the item's recipe) so the sheet doesn't flash the
 * recipe tag first.
 */
export const useGroceryItemMealPlanLink = (
  item: (GroceryItemWithMealPlanSource & { id: string }) | null
): GroceryItemMealPlanLink | null => {
  const itemId = item?.id;
  const { data } = db.useQuery(
    itemId
      ? {
          grocery_items: {
            $: { where: { id: itemId } },
            recipe: {},
            meal_plan_ingredient_snapshot: {
              meal_plan_recipe: { recipe: {} },
            },
            meal_plan_item: {},
          },
        }
      : null
  );

  // Ignore a result still held over from the previously presented item.
  const queriedItem = data?.grocery_items[0];
  return resolveGroceryItemMealPlanLink(
    data && (!queriedItem || queriedItem.id === itemId) ? queriedItem : item
  );
};
