/** Shopping status is derived from grocery history, never stored separately. */
export type LinkedGroceryItemState = {
  isChecked?: boolean | null;
  isDeleted?: boolean | null;
} | null;

export const isPending = (item: LinkedGroceryItemState | undefined): boolean =>
  !!item && !item.isChecked && !item.isDeleted;

export const isHistory = (item: LinkedGroceryItemState | undefined): boolean =>
  !!item && (!!item.isChecked || !!item.isDeleted);

export const isOff = (item: LinkedGroceryItemState | undefined): boolean =>
  !item || !!item.isDeleted;

/** Clearing a checked row does not erase the purchase. */
export const isPurchased = (
  item: LinkedGroceryItemState | undefined
): boolean => !!item?.isChecked;

export const isVisible = (item: LinkedGroceryItemState | undefined): boolean =>
  !!item && !item.isDeleted;

export type IngredientShoppingStatus =
  | 'pending'
  | 'purchased'
  | 'removed'
  | 'unselected';

export const getIngredientShoppingStatus = (
  item: LinkedGroceryItemState | undefined
): IngredientShoppingStatus =>
  isPurchased(item)
    ? 'purchased'
    : isVisible(item)
      ? 'pending'
      : item?.isDeleted
        ? 'removed'
        : 'unselected';

type IngredientSnapshot = {
  sourceRecipeIngredientId: string;
  isSelected: boolean;
  grocery_item?: LinkedGroceryItemState;
};

type RecipeEntry = {
  recipe: { recipe_ingredients?: Array<{ id: string }> };
  ingredient_snapshots?: IngredientSnapshot[];
};

type ItemEntry = { grocery_item?: LinkedGroceryItemState };

/** First snapshot per current source is authoritative, as in the sync planner. */
export function getCanonicalSnapshots<
  T extends { sourceRecipeIngredientId: string },
>(sources: readonly { id: string }[], snapshots: readonly T[]): T[] {
  const remaining = new Set(sources.map(source => source.id));
  return snapshots.filter(snapshot => {
    if (!remaining.has(snapshot.sourceRecipeIngredientId)) return false;
    remaining.delete(snapshot.sourceRecipeIngredientId);
    return true;
  });
}

export type MealPlanShoppingState = {
  isShownOnGroceryList: boolean;
  visibleCount: number;
  pendingCount: number;
  purchasedCount: number;
  includedCount: number;
  allPurchased: boolean;
  status: 'all-purchased' | 'partial' | 'none-purchased' | 'not-shown';
};

export function getMealPlanShoppingState(
  entry: RecipeEntry | ItemEntry
): MealPlanShoppingState {
  const snapshots =
    'recipe' in entry
      ? getCanonicalSnapshots(
          entry.recipe.recipe_ingredients ?? [],
          entry.ingredient_snapshots ?? []
        )
      : [{ isSelected: true, grocery_item: entry.grocery_item }];
  // Linked purchases win over inconsistent legacy selection flags. Visible
  // links still count even when a legacy client deselected their snapshot.
  const included = snapshots.filter(
    row =>
      row.isSelected ||
      isPurchased(row.grocery_item) ||
      isVisible(row.grocery_item)
  );
  const visibleCount = snapshots.filter(row =>
    isVisible(row.grocery_item)
  ).length;
  const pendingCount = snapshots.filter(row =>
    isPending(row.grocery_item)
  ).length;
  const purchasedCount = included.filter(row =>
    isPurchased(row.grocery_item)
  ).length;
  const includedCount = included.length;
  const allPurchased = includedCount > 0 && purchasedCount === includedCount;
  return {
    isShownOnGroceryList: visibleCount > 0,
    visibleCount,
    pendingCount,
    purchasedCount,
    includedCount,
    allPurchased,
    status: allPurchased
      ? 'all-purchased'
      : purchasedCount > 0
        ? 'partial'
        : visibleCount > 0
          ? 'none-purchased'
          : 'not-shown',
  };
}
