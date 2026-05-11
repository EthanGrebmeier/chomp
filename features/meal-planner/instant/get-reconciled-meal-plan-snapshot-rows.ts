import { MealPlanIngredientSnapshotStore } from './meal-plan-ingredient-snapshot-store';

/**
 * Ensures legacy snapshots are backfilled and returns the latest reconciled rows.
 * Falls back to freshly backfilled rows when reconciliation does not return updates.
 */
export const getReconciledMealPlanSnapshotRows = async (
  mealPlanRecipeId: string
) => {
  const snapshotRows =
    await MealPlanIngredientSnapshotStore.ensureBackfilledSnapshot(
      mealPlanRecipeId
    );
  const reconciledRows = await MealPlanIngredientSnapshotStore.reconcileSnapshot(
    mealPlanRecipeId
  );

  return reconciledRows.length > 0 || snapshotRows.length === 0
    ? reconciledRows
    : snapshotRows;
};
