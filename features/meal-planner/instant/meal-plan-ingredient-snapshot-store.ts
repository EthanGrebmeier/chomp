import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

type SnapshotRowWithStore = {
  id: string;
  sourceRecipeIngredientId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  isSelected: boolean;
  isQuantityOverridden: boolean;
  store?: { id: string } | null;
};

export type MealPlanRecipeIngredientSnapshotRow = SnapshotRowWithStore;

export type UpdateSnapshotRowOverridesArgs = {
  snapshotRowId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    notes?: string | null;
    category?: string | null;
    storeId?: string;
    isQuantityOverridden?: boolean;
  };
  /** List default store, applied to the linked item when it has no store. */
  defaultStore: DefaultStoreForStacking | null | undefined;
};

const initializeSnapshot = async (mealPlanRecipeId: string) => {
  const { quantitySnapshots } =
    await import('@/features/quantity/app/meal-actions');
  return quantitySnapshots(mealPlanRecipeId);
};

const readSnapshot = async (mealPlanRecipeId: string) => {
  const { quantitySnapshots } =
    await import('@/features/quantity/app/meal-actions');
  return quantitySnapshots(mealPlanRecipeId);
};

const ensureBackfilledSnapshot = async (mealPlanRecipeId: string) => {
  const { quantitySnapshots } =
    await import('@/features/quantity/app/meal-actions');
  return quantitySnapshots(mealPlanRecipeId);
};

export type SnapshotRowSelection = {
  snapshotRowId: string;
  isSelected: boolean;
};

/**
 * Selects or deselects snapshot rows of one meal plan recipe (e.g. select
 * all/none) in one transaction, adding or removing their linked unchecked
 * grocery items. Filters out ineligible rows (checked, deleted, ignored, etc.).
 */
const updateRowsSelection = async ({
  mealPlanRecipeId,
  selections,
}: {
  mealPlanRecipeId: string;
  selections: SnapshotRowSelection[];
  defaultStore: DefaultStoreForStacking | null | undefined;
}) => {
  const { selectQuantityIngredients } =
    await import('@/features/quantity/app/meal-actions');
  return selectQuantityIngredients(mealPlanRecipeId, selections);
};

/**
 * Selects or deselects one snapshot row, adding or removing its linked
 * unchecked grocery item. Ignores the edit if the row is ineligible
 * (checked, deleted, ignored, etc.).
 */
const updateRowSelection = async ({
  snapshotRowId,
  isSelected,
}: SnapshotRowSelection & {
  defaultStore: DefaultStoreForStacking | null | undefined;
}) => {
  const { selectQuantityIngredient } =
    await import('@/features/quantity/app/meal-actions');
  return selectQuantityIngredient(snapshotRowId, isSelected);
};

/**
 * Edits a snapshot row's overrides and updates its linked unchecked grocery
 * item to match. A quantity edit marks the quantity as overridden.
 */
const updateRowOverrides = async ({
  snapshotRowId,
  updates,
  defaultStore,
}: UpdateSnapshotRowOverridesArgs) => {
  const { overrideQuantityIngredient } =
    await import('@/features/quantity/app/meal-actions');
  return overrideQuantityIngredient({ snapshotRowId, updates, defaultStore });
};

const reconcileSnapshot = async (mealPlanRecipeId: string) => {
  const { quantitySnapshots } =
    await import('@/features/quantity/app/meal-actions');
  return quantitySnapshots(mealPlanRecipeId);
};

export const MealPlanIngredientSnapshotStore = {
  initializeSnapshot,
  readSnapshot,
  updateRowSelection,
  updateRowOverrides,
  updateRowsSelection,
  reconcileSnapshot,
  ensureBackfilledSnapshot,
};
