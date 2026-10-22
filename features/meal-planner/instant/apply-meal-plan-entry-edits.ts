import type {
  MealPlanItemEntryForSync,
  MealPlanRecipeEntryForSync,
  MealPlanSnapshotRowForSync,
} from './plan-meal-plan-list-sync';

type StoreRef = { id: string } | null | undefined;

/** Drops `undefined` fields so a partial edit never blanks a value. */
const definedFields = <T extends object>(fields: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

/**
 * Resolves a `storeId` edit against the current store: `undefined` keeps it,
 * an empty string clears it, any other id replaces it.
 */
export const resolveStoreEdit = (
  currentStore: StoreRef,
  storeId: string | undefined
): StoreRef => {
  if (storeId === undefined) {
    return currentStore;
  }

  return storeId ? { id: storeId } : null;
};

export type SnapshotRowEdit = Partial<
  Omit<MealPlanSnapshotRowForSync, 'id' | 'grocery_item' | 'store'>
> & {
  /** See `resolveStoreEdit`. */
  storeId?: string;
};

/**
 * Returns the recipe entry with edits applied to some of its snapshot rows,
 * keyed by snapshot row id, so the sync planner sees the post-edit state.
 */
export const applySnapshotRowEdits = (
  entry: MealPlanRecipeEntryForSync,
  editsBySnapshotRowId: ReadonlyMap<string, SnapshotRowEdit>
): MealPlanRecipeEntryForSync => ({
  ...entry,
  snapshotRows: entry.snapshotRows.map(row => {
    const edit = editsBySnapshotRowId.get(row.id);
    if (!edit) {
      return row;
    }

    const { storeId, ...fields } = edit;
    return {
      ...row,
      ...definedFields(fields),
      store: resolveStoreEdit(row.store, storeId),
    };
  }),
});

export type MealPlanItemEdit = Partial<
  Pick<
    MealPlanItemEntryForSync,
    'name' | 'quantity' | 'unit' | 'notes' | 'category'
  >
> & {
  /** See `resolveStoreEdit`. */
  storeId?: string;
};

/**
 * Returns the standalone item entry with edits applied, so the sync planner
 * sees the post-edit state.
 */
export const applyMealPlanItemEdit = (
  entry: MealPlanItemEntryForSync,
  { storeId, ...fields }: MealPlanItemEdit
): MealPlanItemEntryForSync => ({
  ...entry,
  ...definedFields(fields),
  store: resolveStoreEdit(entry.store, storeId),
});
