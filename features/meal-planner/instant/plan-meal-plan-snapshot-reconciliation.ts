type RecipeIngredientForReconciliation = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  store?: { id: string } | null;
};

type ExistingSnapshotRow = {
  id: string;
  sourceRecipeIngredientId: string;
};

export type SnapshotRowToCreate = {
  sourceRecipeIngredientId: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  category: string | null;
  isSelected: boolean;
  isQuantityOverridden: boolean;
  storeId?: string;
};

export type MealPlanSnapshotReconciliationPlan = {
  rowsToCreate: SnapshotRowToCreate[];
  rowIdsToDelete: string[];
};

export type PlanMealPlanSnapshotReconciliationArgs = {
  sourceIngredients: RecipeIngredientForReconciliation[];
  existingSnapshotRows: ExistingSnapshotRow[];
};

/**
 * Computes the snapshot rows to create and delete so a meal plan recipe's
 * ingredient snapshots stay in sync with its source recipe ingredients.
 *
 * - Backfills a snapshot row for every source ingredient that has none yet
 *   (covers both legacy recipes with zero snapshots and newly-added ingredients).
 * - Marks snapshot rows whose source ingredient no longer exists for deletion.
 *
 * Pure and tx-free so it can be unit-tested and its output batched into a single
 * transaction by the caller.
 */
export const planMealPlanSnapshotReconciliation = ({
  sourceIngredients,
  existingSnapshotRows,
}: PlanMealPlanSnapshotReconciliationArgs): MealPlanSnapshotReconciliationPlan => {
  const sourceIngredientIds = new Set(
    sourceIngredients.map(source => source.id)
  );
  const existingRowsBySourceId = new Map(
    existingSnapshotRows.map(row => [row.sourceRecipeIngredientId, row])
  );

  const rowsToCreate: SnapshotRowToCreate[] = [];
  for (const sourceIngredient of sourceIngredients) {
    if (existingRowsBySourceId.has(sourceIngredient.id)) {
      continue;
    }

    rowsToCreate.push({
      sourceRecipeIngredientId: sourceIngredient.id,
      name: sourceIngredient.name,
      quantity: sourceIngredient.quantity,
      unit: sourceIngredient.unit,
      notes: sourceIngredient.notes ?? null,
      category: sourceIngredient.category ?? null,
      isSelected: true,
      isQuantityOverridden: false,
      storeId: sourceIngredient.store?.id,
    });
  }

  const rowIdsToDelete: string[] = [];
  for (const row of existingSnapshotRows) {
    if (!sourceIngredientIds.has(row.sourceRecipeIngredientId)) {
      rowIdsToDelete.push(row.id);
    }
  }

  return { rowsToCreate, rowIdsToDelete };
};
