import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

import type {
  MealPlanItemSyncRow,
  MealPlanRecipeSyncRow,
} from './meal-plan-entry-sync-context';
import type { SnapshotRowToCreateWithId } from './plan-meal-plan-entry-ignored';
import {
  type LinkedGroceryItemForSync,
  type MealPlanItemEntryForSync,
  type MealPlanListSyncLinkedItemChange,
  type MealPlanListSyncPlan,
  type MealPlanListSyncSource,
  type MealPlanRecipeEntryForSync,
  planMealPlanListSync,
} from './plan-meal-plan-list-sync';
import { planMealPlanSnapshotReconciliation } from './plan-meal-plan-snapshot-reconciliation';

/**
 * A grocery item on the list that links to a meal plan source, as seen from
 * the grocery item side (so duplicates and dangling links show up).
 */
export type ListLinkedGroceryItem = LinkedGroceryItemForSync & {
  meal_plan_ingredient_snapshot?: { id: string } | null;
  meal_plan_item?: { id: string } | null;
};

/** Meal plan recipe rows of the list; `grocery_list` is not needed. */
export type MealPlanRecipeReconciliationRow = Omit<
  MealPlanRecipeSyncRow,
  'grocery_list'
>;

/** Meal plan item rows of the list; `grocery_list` is not needed. */
export type MealPlanItemReconciliationRow = Omit<
  MealPlanItemSyncRow,
  'grocery_list'
>;

export type PlanMealPlanListReconciliationArgs = {
  recipeRows: MealPlanRecipeReconciliationRow[];
  itemRows: MealPlanItemReconciliationRow[];
  /** Every grocery item on the list with a meal plan link. */
  linkedGroceryItems: ListLinkedGroceryItem[];
  /** List default store, applied to created linked items without a store. */
  defaultStore?: DefaultStoreForStacking | null;
  /** Id factory for backfilled snapshot rows. */
  createId: () => string;
};

export type SnapshotRowsToCreateForEntry = {
  mealPlanRecipeId: string;
  rows: SnapshotRowToCreateWithId[];
};

export type MealPlanListReconciliationPlan = {
  /** Snapshot rows backfilled for recipe ingredients that have none yet. */
  snapshotRowsToCreate: SnapshotRowsToCreateForEntry[];
  /** Snapshot rows whose recipe ingredient no longer exists. */
  snapshotRowIdsToDelete: string[];
  /**
   * Linked grocery item changes. Never has updates: see
   * `planMealPlanListReconciliation`.
   */
  listSync: Pick<MealPlanListSyncPlan, 'creates' | 'deletes' | 'unlinks'>;
};

const sourceKey = (source: MealPlanListSyncSource) =>
  source.type === 'snapshot'
    ? `snapshot:${source.snapshotId}`
    : `item:${source.mealPlanItemId}`;

const listItemSource = (
  item: ListLinkedGroceryItem
): MealPlanListSyncSource | null => {
  if (item.meal_plan_ingredient_snapshot) {
    return {
      type: 'snapshot',
      snapshotId: item.meal_plan_ingredient_snapshot.id,
    };
  }
  if (item.meal_plan_item) {
    return { type: 'item', mealPlanItemId: item.meal_plan_item.id };
  }
  return null;
};

const isLive = (item: LinkedGroceryItemForSync) =>
  !item.isChecked && !item.isDeleted;

type LinkedItemResolution = {
  /** The one linked item the source keeps, if any. */
  keeper: LinkedGroceryItemForSync | null;
  deletes: MealPlanListSyncLinkedItemChange[];
  unlinks: MealPlanListSyncLinkedItemChange[];
};

/**
 * Picks the one linked item a source keeps when several point at it. Checked
 * and soft-deleted items win (they are history and already satisfy the
 * invariant), then the source's own link, then list order. Extra live items
 * are deleted; extra checked or soft-deleted ones only lose the link.
 */
const resolveLinkedItems = (
  source: MealPlanListSyncSource,
  candidates: (LinkedGroceryItemForSync | null | undefined)[]
): LinkedItemResolution => {
  const unique = new Map<string, LinkedGroceryItemForSync>();
  for (const candidate of candidates) {
    if (candidate && !unique.has(candidate.id)) {
      unique.set(candidate.id, candidate);
    }
  }
  const items = [...unique.values()];
  const keeper = items.find(item => !isLive(item)) ?? items[0] ?? null;
  const resolution: LinkedItemResolution = {
    keeper,
    deletes: [],
    unlinks: [],
  };

  for (const item of items) {
    if (item === keeper) {
      continue;
    }
    const change = { source, groceryItemId: item.id };
    if (isLive(item)) {
      resolution.deletes.push(change);
    } else {
      resolution.unlinks.push(change);
    }
  }

  return resolution;
};

/**
 * Plans the repairs that bring a whole list's meal plan and its linked
 * grocery items back in line, as a safety net for drift left by old clients
 * or failed writes. Runs `planMealPlanSnapshotReconciliation` and
 * `planMealPlanListSync` over every entry and combines the results.
 *
 * Invariant: each selected ingredient of an entry that isn't ignored (and
 * each standalone item that isn't ignored) has exactly one linked grocery
 * item. Checked, unchecked and soft-deleted items all count, so cleared or
 * deleted items are never re-created.
 *
 * - Missing linked items are created; extra live ones are deleted, and extra
 *   checked or soft-deleted ones are unlinked.
 * - Ignored entries get nothing created (and no snapshot backfill, which
 *   un-ignoring does itself); leftover unchecked items are removed.
 * - Snapshot rows are backfilled for new recipe ingredients and deleted for
 *   removed ones.
 * - Grocery items linked to a source that isn't on this list's meal plan
 *   are dropped: deleted when live, unlinked otherwise.
 * - Recipe entries whose recipe isn't visible are left alone: a private
 *   recipe of another member may just be hidden, not gone.
 * - Linked item fields are never updated. Both sides write each other on
 *   every edit, and a projection that re-applies each member's own default
 *   store would make members' devices fight over the item.
 *
 * Pure and tx-free; see `buildMealPlanListReconciliationTransactions`.
 */
export const planMealPlanListReconciliation = ({
  recipeRows,
  itemRows,
  linkedGroceryItems,
  defaultStore,
  createId,
}: PlanMealPlanListReconciliationArgs): MealPlanListReconciliationPlan => {
  const plan: MealPlanListReconciliationPlan = {
    snapshotRowsToCreate: [],
    snapshotRowIdsToDelete: [],
    listSync: { creates: [], deletes: [], unlinks: [] },
  };

  const listItemsBySource = new Map<string, ListLinkedGroceryItem[]>();
  for (const item of linkedGroceryItems) {
    const source = listItemSource(item);
    if (!source) {
      continue;
    }
    const key = sourceKey(source);
    listItemsBySource.set(key, [...(listItemsBySource.get(key) ?? []), item]);
  }

  const knownSourceKeys = new Set<string>();
  const resolve = (
    source: MealPlanListSyncSource,
    entryLinkedItem: LinkedGroceryItemForSync | null | undefined
  ) => {
    const key = sourceKey(source);
    knownSourceKeys.add(key);
    const resolution = resolveLinkedItems(source, [
      entryLinkedItem,
      ...(listItemsBySource.get(key) ?? []),
    ]);
    plan.listSync.deletes.push(...resolution.deletes);
    plan.listSync.unlinks.push(...resolution.unlinks);
    return resolution.keeper;
  };
  const addSync = (
    entry: MealPlanRecipeEntryForSync | MealPlanItemEntryForSync
  ) => {
    const { creates, deletes, unlinks } = planMealPlanListSync({
      entry,
      defaultStore,
    });
    plan.listSync.creates.push(...creates);
    plan.listSync.deletes.push(...deletes);
    plan.listSync.unlinks.push(...unlinks);
  };

  for (const row of recipeRows) {
    const snapshots = row.ingredient_snapshots ?? [];
    const recipe = row.recipe;
    if (!recipe) {
      for (const snapshot of snapshots) {
        knownSourceKeys.add(
          sourceKey({ type: 'snapshot', snapshotId: snapshot.id })
        );
      }
      continue;
    }

    const sourceIngredients = recipe.recipe_ingredients ?? [];
    const snapshotPlan = planMealPlanSnapshotReconciliation({
      sourceIngredients,
      existingSnapshotRows: snapshots,
    });
    plan.snapshotRowIdsToDelete.push(...snapshotPlan.rowIdsToDelete);

    const rowsToCreate = row.ignoredByGroceryList
      ? []
      : snapshotPlan.rowsToCreate.map(snapshotRow => ({
          ...snapshotRow,
          id: createId(),
        }));
    if (rowsToCreate.length > 0) {
      plan.snapshotRowsToCreate.push({
        mealPlanRecipeId: row.id,
        rows: rowsToCreate,
      });
    }

    addSync({
      kind: 'recipe',
      id: row.id,
      recipeId: recipe.id,
      servings: row.servings,
      ignoredByGroceryList: row.ignoredByGroceryList,
      sourceIngredients,
      snapshotRows: [
        ...snapshots.map(snapshot => ({
          ...snapshot,
          store: snapshot.store ?? null,
          grocery_item: resolve(
            { type: 'snapshot', snapshotId: snapshot.id },
            snapshot.grocery_item
          ),
        })),
        ...rowsToCreate.map(({ storeId, ...snapshotRow }) => ({
          ...snapshotRow,
          store: storeId ? { id: storeId } : null,
          grocery_item: null,
        })),
      ],
    });
  }

  for (const { store, grocery_item, ...item } of itemRows) {
    addSync({
      ...item,
      kind: 'item',
      store: store ?? null,
      grocery_item: resolve(
        { type: 'item', mealPlanItemId: item.id },
        grocery_item
      ),
    });
  }

  for (const item of linkedGroceryItems) {
    const source = listItemSource(item);
    if (!source || knownSourceKeys.has(sourceKey(source))) {
      continue;
    }
    const change = { source, groceryItemId: item.id };
    if (isLive(item)) {
      plan.listSync.deletes.push(change);
    } else {
      plan.listSync.unlinks.push(change);
    }
  }

  return plan;
};

/** True when the plan has no writes, so no transaction is needed. */
export const isMealPlanListReconciliationPlanEmpty = ({
  snapshotRowsToCreate,
  snapshotRowIdsToDelete,
  listSync,
}: MealPlanListReconciliationPlan): boolean =>
  snapshotRowsToCreate.length === 0 &&
  snapshotRowIdsToDelete.length === 0 &&
  listSync.creates.length === 0 &&
  listSync.deletes.length === 0 &&
  listSync.unlinks.length === 0;
