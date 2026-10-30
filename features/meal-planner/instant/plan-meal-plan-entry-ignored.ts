import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';
import { getCanonicalSnapshots, isHistory } from '../utils/shopping-state';

import {
  type LinkedGroceryItemForSync,
  type MealPlanEntryForSync,
  type MealPlanListSyncLinkedItemChange,
  type MealPlanListSyncPlan,
  type MealPlanListSyncSource,
  type MealPlanRecipeEntryForSync,
  planMealPlanListSync,
} from './plan-meal-plan-list-sync';
import {
  planMealPlanSnapshotReconciliation,
  type SnapshotRowToCreate,
} from './plan-meal-plan-snapshot-reconciliation';

export type SnapshotRowToCreateWithId = SnapshotRowToCreate & { id: string };

export type MealPlanEntryIgnoredPlan = {
  snapshotRowIdsToSelect: string[];
  /** Missing ingredient snapshots, backfilled before restoring shopping. */
  snapshotRowsToCreate: SnapshotRowToCreateWithId[];
  listSync: MealPlanListSyncPlan;
  /** Hide checked history without losing its purchase state or source link. */
  softDeletes: { groceryItemId: string }[];
  /** Show selected purchases again, keeping them checked. */
  softRestores: { groceryItemId: string }[];
};

export type PlanMealPlanEntryIgnoredArgs = {
  entry: MealPlanEntryForSync;
  ignored: boolean;
  defaultStore?: DefaultStoreForStacking | null;
  createId: () => string;
};

type RecipeRestore = Pick<
  MealPlanEntryIgnoredPlan,
  'snapshotRowIdsToSelect' | 'snapshotRowsToCreate'
> & {
  entry: MealPlanRecipeEntryForSync;
};

/** Keep the saved selection, selecting all only when nothing is selected. */
const planRecipeRestore = (
  entry: MealPlanRecipeEntryForSync,
  createId: () => string
): RecipeRestore => {
  const currentRows = getCanonicalSnapshots(
    entry.sourceIngredients,
    entry.snapshotRows
  );
  const snapshotRowIdsToSelect = currentRows.some(row => row.isSelected)
    ? []
    : currentRows.map(row => row.id);
  const idsToSelect = new Set(snapshotRowIdsToSelect);
  const snapshotRowsToCreate = planMealPlanSnapshotReconciliation({
    sourceIngredients: entry.sourceIngredients,
    existingSnapshotRows: entry.snapshotRows,
  }).rowsToCreate.map(row => ({ ...row, id: createId() }));

  return {
    snapshotRowIdsToSelect,
    snapshotRowsToCreate,
    entry: {
      ...entry,
      snapshotRows: [
        ...entry.snapshotRows.map(row =>
          idsToSelect.has(row.id) ? { ...row, isSelected: true } : row
        ),
        ...snapshotRowsToCreate.map(({ storeId, ...row }) => ({
          ...row,
          store: storeId ? { id: storeId } : null,
          grocery_item: null,
        })),
      ],
    },
  };
};

/**
 * Showing restores the saved selection and reveals its purchases without
 * buying them again. Removed, unchecked rows may be replaced with pending rows.
 * Hiding removes pending rows and hides purchases without losing history.
 */
export const planMealPlanEntryIgnored = ({
  entry,
  ignored,
  defaultStore,
  createId,
}: PlanMealPlanEntryIgnoredArgs): MealPlanEntryIgnoredPlan => {
  const restore =
    !ignored && entry.kind === 'recipe'
      ? planRecipeRestore(entry, createId)
      : { snapshotRowIdsToSelect: [], snapshotRowsToCreate: [], entry };
  const historyUnlinks: MealPlanListSyncLinkedItemChange[] = [];
  const softDeleteIds = new Set<string>();
  const softRestoreIds = new Set<string>();

  const hidePurchase = (item: LinkedGroceryItemForSync | null | undefined) => {
    if (item?.isChecked && !item.isDeleted) softDeleteIds.add(item.id);
  };
  const replaceHistory = (
    source: MealPlanListSyncSource,
    item: LinkedGroceryItemForSync | null | undefined
  ) => {
    if (!item || !isHistory(item)) return item;
    if (item.isChecked) {
      if (item.isDeleted) softRestoreIds.add(item.id);
      return item;
    }
    historyUnlinks.push({ source, groceryItemId: item.id });
    return null;
  };

  let entryForSync = restore.entry;
  if (ignored) {
    const items =
      entry.kind === 'recipe'
        ? entry.snapshotRows.map(row => row.grocery_item)
        : [entry.grocery_item];
    items.forEach(hidePurchase);
  } else if (entryForSync.kind === 'recipe') {
    const selectedIds = new Set(
      getCanonicalSnapshots(
        entryForSync.sourceIngredients,
        entryForSync.snapshotRows
      )
        .filter(row => row.isSelected)
        .map(row => row.id)
    );
    entryForSync = {
      ...entryForSync,
      snapshotRows: entryForSync.snapshotRows.map(row =>
        selectedIds.has(row.id)
          ? {
              ...row,
              grocery_item: replaceHistory(
                { type: 'snapshot', snapshotId: row.id },
                row.grocery_item
              ),
            }
          : row
      ),
    };
  } else {
    entryForSync = {
      ...entryForSync,
      grocery_item: replaceHistory(
        { type: 'item', mealPlanItemId: entryForSync.id },
        entryForSync.grocery_item
      ),
    };
  }

  const listSync = planMealPlanListSync({
    entry: { ...entryForSync, ignoredByGroceryList: ignored },
    defaultStore,
  });
  return {
    snapshotRowIdsToSelect: restore.snapshotRowIdsToSelect,
    snapshotRowsToCreate: restore.snapshotRowsToCreate,
    listSync: {
      ...listSync,
      unlinks: [...listSync.unlinks, ...historyUnlinks],
    },
    softDeletes: [...softDeleteIds].map(groceryItemId => ({ groceryItemId })),
    softRestores: [...softRestoreIds].map(groceryItemId => ({ groceryItemId })),
  };
};
