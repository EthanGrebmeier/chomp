import type { MealPlanListSyncSource } from './plan-meal-plan-list-sync';

type StoreRef = { id: string } | null | undefined;

/**
 * A grocery item with its meal plan links, as loaded by the grocery list
 * (`useGroceryListItems`). Each link carries its source's own store, which
 * can differ from the item's (e.g. the list default store).
 */
export type GroceryItemWithMealPlanWriteBackLinks = {
  meal_plan_ingredient_snapshot?: { id: string; store?: StoreRef } | null;
  meal_plan_item?: { id: string; store?: StoreRef } | null;
};

/** The meal plan row a linked grocery item writes back to. */
export type MealPlanWriteBackSource = MealPlanListSyncSource & {
  /** Store currently linked to the source row itself. */
  storeId: string | null;
};

/**
 * Grocery item fields that changed. Only keys that are present are written
 * back; a present key with an empty value (`null`, `undefined`, `''`) clears
 * an optional field (`notes`, `category`, `storeId`).
 */
export type LinkedGroceryItemPatch = {
  name?: string;
  quantity?: number;
  unit?: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string | null;
};

export type MealPlanWriteBackFields = {
  name?: string;
  quantity?: number;
  unit?: string;
  notes?: string | null;
  category?: string | null;
  /** Snapshots only: set when the quantity is written back. */
  isQuantityOverridden?: true;
};

export type ListToMealPlanWriteBackPlan = {
  source: MealPlanListSyncSource;
  fields: MealPlanWriteBackFields;
  /** Set when the source's store link changes. */
  store: { previousStoreId: string | null; nextStoreId: string | null } | null;
};

/**
 * The meal plan source a grocery item is linked to, or `null` for unlinked
 * items.
 */
export const resolveMealPlanWriteBackSource = (
  item: GroceryItemWithMealPlanWriteBackLinks | null | undefined
): MealPlanWriteBackSource | null => {
  const snapshot = item?.meal_plan_ingredient_snapshot;
  if (snapshot) {
    return {
      type: 'snapshot',
      snapshotId: snapshot.id,
      storeId: snapshot.store?.id ?? null,
    };
  }

  const mealPlanItem = item?.meal_plan_item;
  if (mealPlanItem) {
    return {
      type: 'item',
      mealPlanItemId: mealPlanItem.id,
      storeId: mealPlanItem.store?.id ?? null,
    };
  }

  return null;
};

const toOptionalText = (value: string | null | undefined) =>
  value?.trim() || null;

/**
 * Plans how an edit to a linked grocery item writes back to its meal plan
 * source (a recipe ingredient snapshot row or a standalone meal plan item),
 * so the two stay the same data:
 *
 * - name, unit, notes, category and store are copied over;
 * - a quantity edit is copied too, and on a snapshot marks the quantity as
 *   overridden so a later servings change doesn't overwrite it.
 *
 * Returns `null` when nothing needs writing (no source, or an empty patch).
 */
export const planListToMealPlanWriteBack = ({
  source,
  patch,
}: {
  source: MealPlanWriteBackSource | null | undefined;
  patch: LinkedGroceryItemPatch;
}): ListToMealPlanWriteBackPlan | null => {
  if (!source) return null;

  const fields: MealPlanWriteBackFields = {};

  const name = patch.name?.trim();
  if (name) fields.name = name;

  const unit = patch.unit?.trim();
  if (unit) fields.unit = unit;

  if (patch.quantity !== undefined) {
    fields.quantity = patch.quantity;
    if (source.type === 'snapshot') {
      fields.isQuantityOverridden = true;
    }
  }

  if ('notes' in patch) fields.notes = toOptionalText(patch.notes);
  if ('category' in patch) fields.category = toOptionalText(patch.category);

  let store: ListToMealPlanWriteBackPlan['store'] = null;
  if ('storeId' in patch) {
    const nextStoreId = patch.storeId || null;
    if (nextStoreId !== source.storeId) {
      store = { previousStoreId: source.storeId, nextStoreId };
    }
  }

  if (Object.keys(fields).length === 0 && !store) return null;

  return {
    source:
      source.type === 'snapshot'
        ? { type: 'snapshot', snapshotId: source.snapshotId }
        : { type: 'item', mealPlanItemId: source.mealPlanItemId },
    fields,
    store,
  };
};

/**
 * The source as it is after `patch` has been written back, so later
 * write-backs in the same editing session diff against the right store link.
 */
export const applyPatchToMealPlanWriteBackSource = (
  source: MealPlanWriteBackSource,
  patch: LinkedGroceryItemPatch
): MealPlanWriteBackSource =>
  'storeId' in patch ? { ...source, storeId: patch.storeId || null } : source;
