import { id, tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';
import {
  initializeMealPlanIngredientEditor,
  toSnapshotCreateInputs,
} from '../meal-plan-recipe-ingredient-editor';

import {
  applySnapshotRowEdits,
  type SnapshotRowEdit,
} from './apply-meal-plan-entry-edits';
import { buildSnapshotRowCreateTransactions } from './build-snapshot-row-create-transactions';
import { buildMealPlanEntrySyncTransactions } from './build-meal-plan-list-sync-transactions';
import {
  type MealPlanRecipeSyncRow,
  toMealPlanRecipeSyncContext,
} from './meal-plan-entry-sync-context';
import { queryMealPlanRecipeSyncRow } from './query-meal-plan-entry-sync-rows';

type RecipeIngredientWithStore = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  store?: { id: string } | null;
};

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

type SnapshotContext = {
  id: string;
  recipe?: {
    id: string;
    recipe_ingredients?: RecipeIngredientWithStore[];
  } | null;
  ingredient_snapshots?: SnapshotRowWithStore[];
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

const getSnapshotContext = async (
  mealPlanRecipeId: string
): Promise<SnapshotContext | null> => {
  const result = await db.queryOnce({
    meal_plan_recipes: {
      $: {
        where: {
          id: mealPlanRecipeId,
        },
      },
      recipe: {
        recipe_ingredients: {
          store: {},
        },
      },
      ingredient_snapshots: {
        store: {},
      },
    },
  });

  return (
    (result.data.meal_plan_recipes?.[0] as SnapshotContext | undefined) ?? null
  );
};

const orderRowsBySourceIngredients = (
  sourceIngredients: RecipeIngredientWithStore[],
  rows: SnapshotRowWithStore[]
): SnapshotRowWithStore[] => {
  const rowsBySourceId = new Map(
    rows.map(row => [row.sourceRecipeIngredientId, row])
  );
  const orderedRows: SnapshotRowWithStore[] = [];

  for (const sourceIngredient of sourceIngredients) {
    const matchingRow = rowsBySourceId.get(sourceIngredient.id);
    if (!matchingRow) continue;
    orderedRows.push(matchingRow);
    rowsBySourceId.delete(sourceIngredient.id);
  }

  // Keep any orphaned rows at the end to avoid dropping data in read paths.
  for (const row of rowsBySourceId.values()) {
    orderedRows.push(row);
  }

  return orderedRows;
};

const toNewSnapshotRows = (sourceIngredients: RecipeIngredientWithStore[]) =>
  toSnapshotCreateInputs(
    initializeMealPlanIngredientEditor(sourceIngredients)
  ).map(snapshot => ({ ...snapshot, id: id() }));

const initializeSnapshot = async (mealPlanRecipeId: string) => {
  const context = await getSnapshotContext(mealPlanRecipeId);
  if (!context) {
    throw new Error('Meal plan recipe not found');
  }

  const sourceIngredients = context.recipe?.recipe_ingredients ?? [];
  const existingRows = context.ingredient_snapshots ?? [];

  if (existingRows.length > 0 || sourceIngredients.length === 0) {
    return orderRowsBySourceIngredients(sourceIngredients, existingRows);
  }

  const createTransactions = buildSnapshotRowCreateTransactions({
    mealPlanRecipeId,
    rows: toNewSnapshotRows(sourceIngredients),
  });

  if (createTransactions.length > 0) {
    await db.transact(createTransactions);
  }

  const refreshedContext = await getSnapshotContext(mealPlanRecipeId);
  const refreshedRows = refreshedContext?.ingredient_snapshots ?? [];

  return orderRowsBySourceIngredients(sourceIngredients, refreshedRows);
};

const readSnapshot = async (mealPlanRecipeId: string) => {
  const context = await getSnapshotContext(mealPlanRecipeId);
  if (!context) {
    throw new Error('Meal plan recipe not found');
  }

  return orderRowsBySourceIngredients(
    context.recipe?.recipe_ingredients ?? [],
    context.ingredient_snapshots ?? []
  );
};

const ensureBackfilledSnapshot = async (mealPlanRecipeId: string) => {
  const context = await getSnapshotContext(mealPlanRecipeId);
  if (!context) {
    throw new Error('Meal plan recipe not found');
  }

  if ((context.ingredient_snapshots ?? []).length > 0) {
    return orderRowsBySourceIngredients(
      context.recipe?.recipe_ingredients ?? [],
      context.ingredient_snapshots ?? []
    );
  }

  return initializeSnapshot(mealPlanRecipeId);
};

export type SnapshotRowSelection = {
  snapshotRowId: string;
  isSelected: boolean;
};

type SnapshotRowEditsPlan = {
  /** Post-edit state per snapshot row, for the sync planner. */
  edits: ReadonlyMap<string, SnapshotRowEdit>;
  /** Writes to the snapshot rows themselves. */
  transactions: TransactionChunk[];
};

/**
 * Loads a meal plan recipe, then writes the snapshot row edits planned
 * against it and, in the same transaction, the linked grocery item changes
 * they cause.
 */
const transactSnapshotRowEdits = async ({
  lookup,
  planEdits,
  defaultStore,
}: {
  lookup: Parameters<typeof queryMealPlanRecipeSyncRow>[0];
  planEdits: (row: MealPlanRecipeSyncRow) => SnapshotRowEditsPlan;
  defaultStore: DefaultStoreForStacking | null | undefined;
}) => {
  const row = await queryMealPlanRecipeSyncRow(lookup);
  if (!row) {
    throw new Error('Meal plan recipe not found');
  }

  const { edits, transactions } = planEdits(row);
  const context = toMealPlanRecipeSyncContext(row);
  if (context) {
    transactions.push(
      ...buildMealPlanEntrySyncTransactions({
        context: {
          ...context,
          entry: applySnapshotRowEdits(context.entry, edits),
        },
        defaultStore,
      })
    );
  }

  await db.transact(transactions);
};

const planSelectionEdits = (
  selections: SnapshotRowSelection[]
): SnapshotRowEditsPlan => ({
  edits: new Map(
    selections.map(({ snapshotRowId, isSelected }) => [
      snapshotRowId,
      { isSelected },
    ])
  ),
  transactions: selections.map(({ snapshotRowId, isSelected }) =>
    tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].update({
      isSelected,
    })
  ),
});

/**
 * Selects or deselects snapshot rows of one meal plan recipe (e.g. select
 * all/none) in one transaction, adding or removing their linked unchecked
 * grocery items.
 */
const updateRowsSelection = async ({
  mealPlanRecipeId,
  selections,
  defaultStore,
}: {
  mealPlanRecipeId: string;
  selections: SnapshotRowSelection[];
  defaultStore: DefaultStoreForStacking | null | undefined;
}) => {
  if (selections.length === 0) return;

  await transactSnapshotRowEdits({
    lookup: { mealPlanRecipeId },
    planEdits: () => planSelectionEdits(selections),
    defaultStore,
  });
};

/**
 * Selects or deselects one snapshot row, adding or removing its linked
 * unchecked grocery item.
 */
const updateRowSelection = async ({
  snapshotRowId,
  isSelected,
  defaultStore,
}: SnapshotRowSelection & {
  defaultStore: DefaultStoreForStacking | null | undefined;
}) => {
  await transactSnapshotRowEdits({
    lookup: { snapshotRowId },
    planEdits: () => planSelectionEdits([{ snapshotRowId, isSelected }]),
    defaultStore,
  });
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
  await transactSnapshotRowEdits({
    lookup: { snapshotRowId },
    planEdits: row => {
      const currentSnapshotRow = row.ingredient_snapshots?.find(
        snapshot => snapshot.id === snapshotRowId
      );
      if (!currentSnapshotRow) {
        throw new Error('Snapshot row not found');
      }

      const { storeId, ...fieldUpdates } = updates;
      const rowUpdates = trimStringFields({
        ...fieldUpdates,
        notes: fieldUpdates.notes ?? null,
        category: fieldUpdates.category ?? null,
        isQuantityOverridden:
          fieldUpdates.isQuantityOverridden ??
          (fieldUpdates.quantity !== undefined
            ? true
            : currentSnapshotRow.isQuantityOverridden),
      });
      const transactions: TransactionChunk[] = [
        tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].update(
          rowUpdates
        ),
      ];

      const currentStoreId = currentSnapshotRow.store?.id;
      if (storeId !== undefined && storeId !== currentStoreId) {
        if (currentStoreId) {
          transactions.push(
            tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].unlink({
              store: currentStoreId,
            })
          );
        }

        if (storeId) {
          transactions.push(
            tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].link({
              store: storeId,
            })
          );
        }
      }

      return {
        edits: new Map([[snapshotRowId, { ...rowUpdates, storeId }]]),
        transactions,
      };
    },
    defaultStore,
  });
};

const reconcileSnapshot = async (mealPlanRecipeId: string) => {
  const context = await getSnapshotContext(mealPlanRecipeId);
  if (!context) {
    throw new Error('Meal plan recipe not found');
  }

  const sourceIngredients = context.recipe?.recipe_ingredients ?? [];
  const snapshotRows = context.ingredient_snapshots ?? [];
  const sourceIngredientIds = new Set(
    sourceIngredients.map(source => source.id)
  );
  const snapshotRowsBySourceId = new Map(
    snapshotRows.map(snapshot => [snapshot.sourceRecipeIngredientId, snapshot])
  );
  const transactions: TransactionChunk[] = [];

  for (const snapshotRow of snapshotRows) {
    if (!sourceIngredientIds.has(snapshotRow.sourceRecipeIngredientId)) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[snapshotRow.id].delete()
      );
    }
  }

  transactions.push(
    ...buildSnapshotRowCreateTransactions({
      mealPlanRecipeId,
      rows: toNewSnapshotRows(
        sourceIngredients.filter(
          sourceIngredient => !snapshotRowsBySourceId.has(sourceIngredient.id)
        )
      ),
    })
  );

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  const refreshedContext = await getSnapshotContext(mealPlanRecipeId);
  if (!refreshedContext) {
    throw new Error('Meal plan recipe not found');
  }

  return orderRowsBySourceIngredients(
    sourceIngredients,
    refreshedContext.ingredient_snapshots ?? []
  );
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
