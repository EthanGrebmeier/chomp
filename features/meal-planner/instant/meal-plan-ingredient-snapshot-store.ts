import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

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

  return (result.data.meal_plan_recipes?.[0] as SnapshotContext | undefined) ?? null;
};

const orderRowsBySourceIngredients = (
  sourceIngredients: RecipeIngredientWithStore[],
  rows: SnapshotRowWithStore[]
): SnapshotRowWithStore[] => {
  const rowsBySourceId = new Map(rows.map(row => [row.sourceRecipeIngredientId, row]));
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

const buildCreateSnapshotTransactions = ({
  mealPlanRecipeId,
  sourceIngredients,
}: {
  mealPlanRecipeId: string;
  sourceIngredients: RecipeIngredientWithStore[];
}) => {
  const transactions = [];

  for (const sourceIngredient of sourceIngredients) {
    const snapshotId = id();

    transactions.push(
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].update(
        trimStringFields({
          sourceRecipeIngredientId: sourceIngredient.id,
          name: sourceIngredient.name,
          quantity: sourceIngredient.quantity,
          unit: sourceIngredient.unit,
          notes: sourceIngredient.notes ?? null,
          category: sourceIngredient.category ?? null,
          isSelected: true,
          isQuantityOverridden: false,
        })
      ),
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
        meal_plan_recipe: mealPlanRecipeId,
      })
    );

    if (sourceIngredient.store?.id) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
          store: sourceIngredient.store.id,
        })
      );
    }
  }

  return transactions;
};

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

  const createTransactions = buildCreateSnapshotTransactions({
    mealPlanRecipeId,
    sourceIngredients,
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

const updateRowSelection = async ({
  snapshotRowId,
  isSelected,
}: {
  snapshotRowId: string;
  isSelected: boolean;
}) => {
  await db.transact([
    tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].update({ isSelected }),
  ]);
};

const updateRowOverrides = async ({
  snapshotRowId,
  updates,
}: UpdateSnapshotRowOverridesArgs) => {
  const currentSnapshotResult = await db.queryOnce({
    meal_plan_recipe_ingredient_snapshots: {
      $: {
        where: {
          id: snapshotRowId,
        },
      },
      store: {},
    },
  });

  const currentSnapshotRow = currentSnapshotResult.data
    .meal_plan_recipe_ingredient_snapshots?.[0] as SnapshotRowWithStore | undefined;

  if (!currentSnapshotRow) {
    throw new Error('Snapshot row not found');
  }

  const { storeId, ...fieldUpdates } = updates;
  const transactions = [
    tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].update(
      trimStringFields({
        ...fieldUpdates,
        notes: fieldUpdates.notes ?? null,
        category: fieldUpdates.category ?? null,
        isQuantityOverridden:
          fieldUpdates.isQuantityOverridden ??
          (fieldUpdates.quantity !== undefined
            ? true
            : currentSnapshotRow.isQuantityOverridden),
      })
    ),
  ];

  if (storeId !== undefined && storeId !== currentSnapshotRow.store?.id) {
    if (currentSnapshotRow.store?.id) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[snapshotRowId].unlink({
          store: currentSnapshotRow.store.id,
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

  await db.transact(transactions);
};

const reconcileSnapshot = async (mealPlanRecipeId: string) => {
  const context = await getSnapshotContext(mealPlanRecipeId);
  if (!context) {
    throw new Error('Meal plan recipe not found');
  }

  const sourceIngredients = context.recipe?.recipe_ingredients ?? [];
  const snapshotRows = context.ingredient_snapshots ?? [];
  const sourceIngredientIds = new Set(sourceIngredients.map(source => source.id));
  const snapshotRowsBySourceId = new Map(
    snapshotRows.map(snapshot => [snapshot.sourceRecipeIngredientId, snapshot])
  );
  const transactions = [];

  for (const snapshotRow of snapshotRows) {
    if (!sourceIngredientIds.has(snapshotRow.sourceRecipeIngredientId)) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[snapshotRow.id].delete()
      );
    }
  }

  for (const sourceIngredient of sourceIngredients) {
    if (snapshotRowsBySourceId.has(sourceIngredient.id)) {
      continue;
    }

    const snapshotId = id();
    transactions.push(
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].update(
        trimStringFields({
          sourceRecipeIngredientId: sourceIngredient.id,
          name: sourceIngredient.name,
          quantity: sourceIngredient.quantity,
          unit: sourceIngredient.unit,
          notes: sourceIngredient.notes ?? null,
          category: sourceIngredient.category ?? null,
          isSelected: true,
          isQuantityOverridden: false,
        })
      ),
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
        meal_plan_recipe: mealPlanRecipeId,
      })
    );

    if (sourceIngredient.store?.id) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
          store: sourceIngredient.store.id,
        })
      );
    }
  }

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
  reconcileSnapshot,
  ensureBackfilledSnapshot,
};
