import { describe, expect, it } from 'vitest';

import { planMealPlanSnapshotReconciliation } from '../plan-meal-plan-snapshot-reconciliation';

describe('planMealPlanSnapshotReconciliation', () => {
  const source = (
    id: string,
    overrides: Partial<{
      name: string;
      quantity: number;
      unit: string;
      notes: string | null;
      category: string | null;
      store: { id: string } | null;
    }> = {}
  ) => ({
    id,
    name: overrides.name ?? `Ingredient ${id}`,
    quantity: overrides.quantity ?? 1,
    unit: overrides.unit ?? 'unit',
    notes: overrides.notes ?? null,
    category: overrides.category ?? null,
    store: overrides.store ?? null,
  });

  it('backfills all source ingredients when no snapshot rows exist', () => {
    const plan = planMealPlanSnapshotReconciliation({
      sourceIngredients: [source('a'), source('b')],
      existingSnapshotRows: [],
    });

    expect(plan.rowsToCreate).toHaveLength(2);
    expect(plan.rowsToCreate.map(row => row.sourceRecipeIngredientId)).toEqual([
      'a',
      'b',
    ]);
    expect(plan.rowsToCreate[0]).toMatchObject({
      isSelected: true,
      isQuantityOverridden: false,
    });
    expect(plan.rowIdsToDelete).toEqual([]);
  });

  it('is a no-op when every source ingredient already has a snapshot', () => {
    const plan = planMealPlanSnapshotReconciliation({
      sourceIngredients: [source('a'), source('b')],
      existingSnapshotRows: [
        { id: 'row-a', sourceRecipeIngredientId: 'a' },
        { id: 'row-b', sourceRecipeIngredientId: 'b' },
      ],
    });

    expect(plan.rowsToCreate).toEqual([]);
    expect(plan.rowIdsToDelete).toEqual([]);
  });

  it('creates rows for added ingredients and deletes orphaned rows', () => {
    const plan = planMealPlanSnapshotReconciliation({
      sourceIngredients: [source('a'), source('c')],
      existingSnapshotRows: [
        { id: 'row-a', sourceRecipeIngredientId: 'a' },
        { id: 'row-b', sourceRecipeIngredientId: 'b' },
      ],
    });

    expect(plan.rowsToCreate.map(row => row.sourceRecipeIngredientId)).toEqual([
      'c',
    ]);
    expect(plan.rowIdsToDelete).toEqual(['row-b']);
  });

  it('carries the source store id onto created rows', () => {
    const plan = planMealPlanSnapshotReconciliation({
      sourceIngredients: [source('a', { store: { id: 'store-1' } })],
      existingSnapshotRows: [],
    });

    expect(plan.rowsToCreate[0].storeId).toBe('store-1');
  });
});
