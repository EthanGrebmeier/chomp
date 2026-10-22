type LinkedGroceryItemState = {
  isChecked?: boolean | null;
  isDeleted?: boolean | null;
} | null;

type RecipeEntryWithLinkedItems = {
  ingredient_snapshots?: { grocery_item?: LinkedGroceryItemState }[] | null;
};

type ItemEntryWithLinkedItem = {
  grocery_item?: LinkedGroceryItemState;
};

const isUnchecked = (item: LinkedGroceryItemState | undefined) =>
  !!item && !item.isChecked && !item.isDeleted;

/**
 * Counts the unchecked grocery items that deleting these meal plan entries
 * would remove from the list. Checked and soft-deleted linked items are kept
 * on removal (see `planMealPlanEntryRemoval`), so they are not counted.
 */
export const countUncheckedLinkedGroceryItems = ({
  recipes = [],
  items = [],
}: {
  recipes?: RecipeEntryWithLinkedItems[];
  items?: ItemEntryWithLinkedItem[];
}): number => {
  const recipeCount = recipes.reduce(
    (count, recipe) =>
      count +
      (recipe.ingredient_snapshots ?? []).filter(snapshot =>
        isUnchecked(snapshot.grocery_item)
      ).length,
    0
  );
  const itemCount = items.filter(item => isUnchecked(item.grocery_item)).length;

  return recipeCount + itemCount;
};

/**
 * Confirmation dialog line for deleting meal plan entries, or null when no
 * unchecked grocery items would be removed.
 */
export const formatUncheckedLinkedGroceryItemsRemovalNotice = (
  count: number
): string | null => {
  if (count <= 0) {
    return null;
  }

  return `This also removes ${count} unchecked ${count === 1 ? 'item' : 'items'} from your grocery list.`;
};

/**
 * Joins a confirmation message with the removal notice for `count` unchecked
 * linked grocery items, leaving the notice out when there are none.
 */
export const withUncheckedLinkedGroceryItemsNotice = (
  message: string,
  count: number
): string => {
  const notice = formatUncheckedLinkedGroceryItemsRemovalNotice(count);

  return notice ? `${message}\n\n${notice}` : message;
};
