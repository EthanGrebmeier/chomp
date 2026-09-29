import {
  applyDefaultStoreToStackableIngredients,
  type DefaultStoreForStacking,
} from '../../recipes/instant/stack-recipe-ingredients-plan';

import {
  type MealPlanToListProjectionInput,
  projectMealPlanRecipeToListRows,
} from './meal-plan-to-list-projection';

/** Grocery item currently linked to a meal plan source. */
export type LinkedGroceryItemForSync = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  isChecked: boolean;
  isDeleted?: boolean | null;
  store?: { id: string } | null;
};

type SourceIngredientForSync =
  MealPlanToListProjectionInput['sourceIngredients'][number];

export type MealPlanSnapshotRowForSync =
  MealPlanToListProjectionInput['snapshotRows'][number] & {
    id: string;
    grocery_item?: LinkedGroceryItemForSync | null;
  };

export type MealPlanRecipeEntryForSync = {
  kind: 'recipe';
  /** `meal_plan_recipes` id. */
  id: string;
  recipeId: string;
  servings?: number | null;
  ignoredByGroceryList?: boolean | null;
  sourceIngredients: SourceIngredientForSync[];
  /**
   * Snapshot rows with their linked grocery item. Source ingredients without a
   * snapshot row cannot be linked, so callers reconcile snapshots first (see
   * `planMealPlanSnapshotReconciliation`) and pass the reconciled rows.
   */
  snapshotRows: MealPlanSnapshotRowForSync[];
};

export type MealPlanItemEntryForSync = {
  kind: 'item';
  /** `meal_plan_items` id. */
  id: string;
  ignoredByGroceryList?: boolean | null;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  store?: { id: string; name?: string | null } | null;
  grocery_item?: LinkedGroceryItemForSync | null;
};

export type MealPlanEntryForSync =
  | MealPlanRecipeEntryForSync
  | MealPlanItemEntryForSync;

/** The meal plan row a linked grocery item mirrors. */
export type MealPlanListSyncSource =
  | { type: 'snapshot'; snapshotId: string }
  | { type: 'item'; mealPlanItemId: string };

/** Grocery item fields projected from a meal plan source. */
export type LinkedGroceryItemFields = {
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  category: string | null;
  storeId: string | null;
};

export type MealPlanListSyncCreate = {
  source: MealPlanListSyncSource;
  fields: LinkedGroceryItemFields;
  /** Recipe to link for recipe sources, so the item keeps it as history. */
  recipeId?: string;
};

export type MealPlanListSyncUpdate = {
  source: MealPlanListSyncSource;
  groceryItemId: string;
  fields: LinkedGroceryItemFields;
  previousStoreId: string | null;
};

export type MealPlanListSyncLinkedItemChange = {
  source: MealPlanListSyncSource;
  groceryItemId: string;
};

export type MealPlanListSyncPlan = {
  creates: MealPlanListSyncCreate[];
  updates: MealPlanListSyncUpdate[];
  /** Unchecked, live linked items to remove from the list. */
  deletes: MealPlanListSyncLinkedItemChange[];
  /** Checked (or soft-deleted) items that lose only their meal plan link. */
  unlinks: MealPlanListSyncLinkedItemChange[];
};

export type PlanMealPlanListSyncArgs = {
  entry: MealPlanEntryForSync;
  /** True when the entry is being deleted (Delete Meal, Clear Meal Plan, …). */
  isRemoved?: boolean;
  /** List default store, applied to sources without a store. */
  defaultStore?: DefaultStoreForStacking | null;
};

type SourceState = {
  source: MealPlanListSyncSource;
  linkedItem: LinkedGroceryItemForSync | null | undefined;
  /** Projected fields when the source should be on the list, else null. */
  projected: LinkedGroceryItemFields | null;
  /** True when the source itself is going away. */
  isRemoved: boolean;
  recipeId?: string;
};

const normalizeOptional = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toFields = (input: {
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string | null;
}): LinkedGroceryItemFields => ({
  name: input.name.trim(),
  quantity: input.quantity,
  unit: input.unit.trim(),
  notes: normalizeOptional(input.notes),
  category: normalizeOptional(input.category),
  storeId: input.storeId ?? null,
});

const linkedItemFields = (
  item: LinkedGroceryItemForSync
): LinkedGroceryItemFields =>
  toFields({ ...item, storeId: item.store?.id ?? null });

const fieldsEqual = (
  left: LinkedGroceryItemFields,
  right: LinkedGroceryItemFields
) =>
  left.name === right.name &&
  left.quantity === right.quantity &&
  left.unit === right.unit &&
  left.notes === right.notes &&
  left.category === right.category &&
  left.storeId === right.storeId;

const isLive = (item: LinkedGroceryItemForSync) =>
  !item.isChecked && !item.isDeleted;

const recipeSourceStates = (
  entry: MealPlanRecipeEntryForSync,
  isEntryActive: boolean,
  isEntryRemoved: boolean,
  defaultStore: DefaultStoreForStacking | null | undefined
): SourceState[] => {
  // Only the first snapshot row per source ingredient is authoritative;
  // duplicates are treated like orphans so they never double up on the list.
  const primaryRowIdBySourceId = new Map<string, string>();
  for (const row of entry.snapshotRows) {
    if (!primaryRowIdBySourceId.has(row.sourceRecipeIngredientId)) {
      primaryRowIdBySourceId.set(row.sourceRecipeIngredientId, row.id);
    }
  }
  const primaryRows = entry.snapshotRows.filter(
    row => primaryRowIdBySourceId.get(row.sourceRecipeIngredientId) === row.id
  );

  const projectedRows = applyDefaultStoreToStackableIngredients(
    projectMealPlanRecipeToListRows({
      recipeId: entry.recipeId,
      // Non-positive servings fall back to 1 inside the projection.
      servings: entry.servings ?? 1,
      sourceIngredients: entry.sourceIngredients,
      snapshotRows: primaryRows,
    }),
    defaultStore
  );
  const projectedBySourceId = new Map(
    projectedRows.map(row => [row.sourceRecipeIngredientId, row])
  );
  const sourceIngredientIds = new Set(
    entry.sourceIngredients.map(source => source.id)
  );

  return entry.snapshotRows.map(row => {
    const isPrimary =
      primaryRowIdBySourceId.get(row.sourceRecipeIngredientId) === row.id;
    const isOrphaned =
      !isPrimary || !sourceIngredientIds.has(row.sourceRecipeIngredientId);
    const projectedRow = projectedBySourceId.get(row.sourceRecipeIngredientId);

    return {
      source: { type: 'snapshot', snapshotId: row.id },
      linkedItem: row.grocery_item,
      projected:
        isEntryActive && !isOrphaned && projectedRow
          ? toFields(projectedRow)
          : null,
      isRemoved: isEntryRemoved || isOrphaned,
      recipeId: entry.recipeId,
    };
  });
};

const itemSourceState = (
  entry: MealPlanItemEntryForSync,
  isEntryActive: boolean,
  isEntryRemoved: boolean,
  defaultStore: DefaultStoreForStacking | null | undefined
): SourceState => {
  const [withStore] = applyDefaultStoreToStackableIngredients(
    [{ ...entry, storeId: entry.store?.id }],
    defaultStore
  );

  return {
    source: { type: 'item', mealPlanItemId: entry.id },
    linkedItem: entry.grocery_item,
    projected: isEntryActive ? toFields(withStore) : null,
    isRemoved: isEntryRemoved,
  };
};

/**
 * Works out the grocery item changes needed so one meal plan entry's linked
 * grocery items match its current state.
 *
 * - Every selected source of an active (not ignored, not removed) entry needs
 *   exactly one linked grocery item. Checked and soft-deleted linked items
 *   count as present, so bought or deleted items are never re-created.
 * - Only unchecked, live linked items are ever updated or deleted: checked
 *   items are history.
 * - When a source goes away (entry removed, or its recipe ingredient deleted),
 *   checked and soft-deleted items are unlinked instead of deleted.
 * - Linked items never stack onto other grocery items.
 *
 * Pure and tx-free; see `buildMealPlanListSyncTransactions` for the writes.
 */
export const planMealPlanListSync = ({
  entry,
  isRemoved = false,
  defaultStore,
}: PlanMealPlanListSyncArgs): MealPlanListSyncPlan => {
  const isEntryActive = !isRemoved && !entry.ignoredByGroceryList;
  const sourceStates =
    entry.kind === 'recipe'
      ? recipeSourceStates(entry, isEntryActive, isRemoved, defaultStore)
      : [itemSourceState(entry, isEntryActive, isRemoved, defaultStore)];

  const plan: MealPlanListSyncPlan = {
    creates: [],
    updates: [],
    deletes: [],
    unlinks: [],
  };

  for (const {
    source,
    linkedItem,
    projected,
    isRemoved: sourceRemoved,
    recipeId,
  } of sourceStates) {
    if (projected) {
      if (!linkedItem) {
        plan.creates.push({ source, fields: projected, recipeId });
        continue;
      }

      if (isLive(linkedItem)) {
        const current = linkedItemFields(linkedItem);
        if (!fieldsEqual(current, projected)) {
          plan.updates.push({
            source,
            groceryItemId: linkedItem.id,
            fields: projected,
            previousStoreId: current.storeId,
          });
        }
      }
      continue;
    }

    if (!linkedItem) {
      continue;
    }

    if (isLive(linkedItem)) {
      plan.deletes.push({ source, groceryItemId: linkedItem.id });
    } else if (sourceRemoved) {
      plan.unlinks.push({ source, groceryItemId: linkedItem.id });
    }
  }

  return plan;
};
