import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

import {
  planMealPlanSnapshotReconciliation,
  type SnapshotRowToCreate,
} from './plan-meal-plan-snapshot-reconciliation';
import {
  type MealPlanEntryForSync,
  type MealPlanListSyncPlan,
  type MealPlanRecipeEntryForSync,
  planMealPlanListSync,
} from './plan-meal-plan-list-sync';

export type SnapshotRowToCreateWithId = SnapshotRowToCreate & { id: string };

export type MealPlanEntryIgnoredPlan = {
  /** Snapshot rows to mark selected before the entry goes back on the list. */
  snapshotRowIdsToSelect: string[];
  /**
   * Snapshot rows to backfill for source ingredients that have none yet (e.g.
   * legacy entries), so un-ignoring can put every ingredient on the list.
   */
  snapshotRowsToCreate: SnapshotRowToCreateWithId[];
  /** Linked grocery item changes for the entry's new state. */
  listSync: MealPlanListSyncPlan;
};

export type PlanMealPlanEntryIgnoredArgs = {
  entry: MealPlanEntryForSync;
  ignored: boolean;
  /** List default store, applied to linked items without a store. */
  defaultStore?: DefaultStoreForStacking | null;
  /** Id factory for backfilled snapshot rows. */
  createId: () => string;
};

type RecipeRestore = Pick<
  MealPlanEntryIgnoredPlan,
  'snapshotRowIdsToSelect' | 'snapshotRowsToCreate'
> & { entry: MealPlanRecipeEntryForSync };

/**
 * Works out how a recipe entry's selection comes back when it is un-ignored:
 * the selection it had is kept as is, missing snapshot rows are backfilled
 * (selected), and when nothing was selected every ingredient is selected.
 */
const planRecipeRestore = (
  entry: MealPlanRecipeEntryForSync,
  createId: () => string
): RecipeRestore => {
  const sourceIngredientIds = new Set(
    entry.sourceIngredients.map(source => source.id)
  );
  const currentRows = entry.snapshotRows.filter(row =>
    sourceIngredientIds.has(row.sourceRecipeIngredientId)
  );
  const hasSelection = currentRows.some(row => row.isSelected);
  const snapshotRowIdsToSelect = hasSelection
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
 * Plans turning "meal plan only" on or off for one meal plan entry, the same
 * way for recipes and standalone items.
 *
 * - Ignoring removes the entry's unchecked linked grocery items. Checked
 *   items are history and stay as they are, and the snapshot selection is
 *   left alone so it can be restored.
 * - Un-ignoring creates linked items for the current selection. A recipe
 *   entry with nothing selected gets every ingredient selected first.
 *
 * Pure and tx-free; see `setMealPlanEntryIgnored` for the writes.
 */
export const planMealPlanEntryIgnored = ({
  entry,
  ignored,
  defaultStore,
  createId,
}: PlanMealPlanEntryIgnoredArgs): MealPlanEntryIgnoredPlan => {
  const restore: Omit<RecipeRestore, 'entry'> & {
    entry: MealPlanEntryForSync;
  } =
    !ignored && entry.kind === 'recipe'
      ? planRecipeRestore(entry, createId)
      : { snapshotRowIdsToSelect: [], snapshotRowsToCreate: [], entry };

  return {
    snapshotRowIdsToSelect: restore.snapshotRowIdsToSelect,
    snapshotRowsToCreate: restore.snapshotRowsToCreate,
    listSync: planMealPlanListSync({
      entry: { ...restore.entry, ignoredByGroceryList: ignored },
      defaultStore,
    }),
  };
};
