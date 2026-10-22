import type { MealPlanEntryRef } from './meal-plan-entry';

/**
 * A grocery item being deleted from the list, with the meal plan state needed
 * to write the delete back: its source and, for recipe ingredients, every
 * snapshot row of the source's meal plan entry.
 */
export type GroceryItemForDeletion = {
  id: string;
  isChecked: boolean;
  isDeleted?: boolean | null;
  meal_plan_ingredient_snapshot?: {
    id: string;
    meal_plan_recipe?: {
      id: string;
      ignoredByGroceryList?: boolean | null;
      ingredient_snapshots?: { id: string; isSelected: boolean }[];
    } | null;
  } | null;
  meal_plan_item?: {
    id: string;
    ignoredByGroceryList?: boolean | null;
  } | null;
};

export type LinkedGroceryItemDeletionPlan = {
  /**
   * Items that just leave the list (soft delete): unlinked items and checked
   * linked items, which keep their meal plan link as history.
   */
  groceryItemIdsToSoftDelete: string[];
  /**
   * Unchecked linked items. They are hard deleted, like the meal plan → list
   * sync does, so reselecting or un-ignoring the source can add them back (a
   * soft-deleted linked item would count as present and block that).
   */
  groceryItemIdsToRemove: string[];
  /** Snapshot rows to deselect in the meal plan. */
  snapshotRowIdsToDeselect: string[];
  /** Entries to mark "meal plan only". */
  entriesToIgnore: MealPlanEntryRef[];
};

const isUncheckedLinkCandidate = (item: GroceryItemForDeletion) =>
  !item.isChecked && !item.isDeleted;

/**
 * Plans how deleting grocery items from the list writes back to the meal plan,
 * so both sides keep agreeing:
 *
 * - An unchecked item linked to a recipe ingredient deselects that
 *   ingredient.
 * - When that leaves a recipe entry with no selected ingredients, the entry is
 *   ignored instead, and the ingredients removed in this delete stay selected,
 *   so turning "meal plan only" off brings them back. Ingredients deleted
 *   earlier stay deselected.
 * - An unchecked standalone planned item ignores its meal plan item.
 * - Checked items are history: deleting them never changes the meal plan.
 * - Entries that are already ignored are left alone.
 *
 * Deletes are grouped per entry, so a bulk delete across several meals applies
 * to each meal on its own. Clearing checked items must not use this planner's
 * write-back; see `clear-checked-items.ts`.
 *
 * Pure and tx-free; see `buildLinkedGroceryItemDeletionTransactions`.
 */
export const planLinkedGroceryItemDeletion = (
  items: GroceryItemForDeletion[]
): LinkedGroceryItemDeletionPlan => {
  const plan: LinkedGroceryItemDeletionPlan = {
    groceryItemIdsToSoftDelete: [],
    groceryItemIdsToRemove: [],
    snapshotRowIdsToDeselect: [],
    entriesToIgnore: [],
  };

  type RecipeGroup = {
    recipe: NonNullable<
      NonNullable<
        GroceryItemForDeletion['meal_plan_ingredient_snapshot']
      >['meal_plan_recipe']
    >;
    deletedSnapshotRowIds: Set<string>;
  };
  const recipeGroups = new Map<string, RecipeGroup>();
  const ignoredItemIds = new Set<string>();

  for (const item of items) {
    const snapshot = item.meal_plan_ingredient_snapshot;
    const mealPlanItem = item.meal_plan_item;
    const isLinked = Boolean(snapshot || mealPlanItem);

    if (!isLinked || !isUncheckedLinkCandidate(item)) {
      if (!item.isDeleted) plan.groceryItemIdsToSoftDelete.push(item.id);
      continue;
    }

    plan.groceryItemIdsToRemove.push(item.id);

    if (snapshot) {
      const recipe = snapshot.meal_plan_recipe;
      if (!recipe || recipe.ignoredByGroceryList) continue;

      const group = recipeGroups.get(recipe.id) ?? {
        recipe,
        deletedSnapshotRowIds: new Set<string>(),
      };
      group.deletedSnapshotRowIds.add(snapshot.id);
      recipeGroups.set(recipe.id, group);
      continue;
    }

    if (
      mealPlanItem &&
      !mealPlanItem.ignoredByGroceryList &&
      !ignoredItemIds.has(mealPlanItem.id)
    ) {
      ignoredItemIds.add(mealPlanItem.id);
      plan.entriesToIgnore.push({ type: 'item', id: mealPlanItem.id });
    }
  }

  for (const { recipe, deletedSnapshotRowIds } of recipeGroups.values()) {
    const hasSelectionLeft = (recipe.ingredient_snapshots ?? []).some(
      row => row.isSelected && !deletedSnapshotRowIds.has(row.id)
    );

    if (hasSelectionLeft) {
      plan.snapshotRowIdsToDeselect.push(...deletedSnapshotRowIds);
    } else {
      plan.entriesToIgnore.push({ type: 'recipe', id: recipe.id });
    }
  }

  return plan;
};
