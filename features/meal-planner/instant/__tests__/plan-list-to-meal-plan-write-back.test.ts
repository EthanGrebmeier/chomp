import { describe, expect, it, vi } from 'vitest';

import {
  buildLinkedGroceryItemWriteBackTransactions,
  buildListToMealPlanWriteBackTransactions,
} from '../build-list-to-meal-plan-write-back-transactions';
import {
  type MealPlanWriteBackSource,
  applyPatchToMealPlanWriteBackSource,
  planListToMealPlanWriteBack,
  resolveMealPlanWriteBackSource,
} from '../plan-list-to-meal-plan-write-back';
import { planMealPlanListSync } from '../plan-meal-plan-list-sync';

vi.mock('@instantdb/react-native', () => {
  const createNamespace = (namespace: string) =>
    new Proxy(
      {},
      {
        get: (_target, entityId: string) =>
          Object.fromEntries(
            ['update', 'link', 'unlink', 'delete'].map(operation => [
              operation,
              (payload?: unknown) => ({
                operation,
                namespace,
                entityId,
                payload,
              }),
            ])
          ),
      }
    );

  return {
    id: () => 'new-id',
    tx: new Proxy(
      {},
      { get: (_target, namespace: string) => createNamespace(namespace) }
    ),
  };
});

const NOW = '2026-01-01T00:00:00.000Z';

const snapshotSource = (
  storeId: string | null = null
): MealPlanWriteBackSource => ({
  type: 'snapshot',
  snapshotId: 'snapshot-1',
  storeId,
});

const itemSource = (
  storeId: string | null = null
): MealPlanWriteBackSource => ({
  type: 'item',
  mealPlanItemId: 'meal-plan-item-1',
  storeId,
});

describe('resolveMealPlanWriteBackSource', () => {
  it('resolves a snapshot source with its own store', () => {
    expect(
      resolveMealPlanWriteBackSource({
        meal_plan_ingredient_snapshot: {
          id: 'snapshot-1',
          store: { id: 'store-1' },
        },
      })
    ).toEqual(snapshotSource('store-1'));
  });

  it('resolves a standalone meal plan item source', () => {
    expect(
      resolveMealPlanWriteBackSource({
        meal_plan_item: { id: 'meal-plan-item-1' },
      })
    ).toEqual(itemSource());
  });

  it('returns null for unlinked items', () => {
    expect(resolveMealPlanWriteBackSource({})).toBeNull();
    expect(
      resolveMealPlanWriteBackSource({
        meal_plan_ingredient_snapshot: null,
        meal_plan_item: null,
      })
    ).toBeNull();
    expect(resolveMealPlanWriteBackSource(null)).toBeNull();
  });
});

describe('planListToMealPlanWriteBack', () => {
  it('copies name, unit, notes and category to a snapshot', () => {
    expect(
      planListToMealPlanWriteBack({
        source: snapshotSource(),
        patch: {
          name: ' Basil ',
          unit: 'bunch',
          notes: 'fresh',
          category: 'produce',
        },
      })
    ).toEqual({
      source: { type: 'snapshot', snapshotId: 'snapshot-1' },
      fields: {
        name: 'Basil',
        unit: 'bunch',
        notes: 'fresh',
        category: 'produce',
      },
      store: null,
    });
  });

  it('marks a snapshot quantity as overridden when the quantity changes', () => {
    expect(
      planListToMealPlanWriteBack({
        source: snapshotSource(),
        patch: { quantity: 3 },
      })?.fields
    ).toEqual({ quantity: 3, isQuantityOverridden: true });
  });

  it('does not touch the override flag when the quantity is unchanged', () => {
    expect(
      planListToMealPlanWriteBack({
        source: snapshotSource(),
        patch: { name: 'Basil' },
      })?.fields
    ).toEqual({ name: 'Basil' });
  });

  it('copies fields to a standalone meal plan item without an override flag', () => {
    expect(
      planListToMealPlanWriteBack({
        source: itemSource(),
        patch: { name: 'Milk', quantity: 2 },
      })
    ).toEqual({
      source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
      fields: { name: 'Milk', quantity: 2 },
      store: null,
    });
  });

  it('clears notes and category when the patch empties them', () => {
    expect(
      planListToMealPlanWriteBack({
        source: itemSource(),
        patch: { notes: '  ', category: undefined },
      })?.fields
    ).toEqual({ notes: null, category: null });
  });

  it('does not clear the required name or unit', () => {
    expect(
      planListToMealPlanWriteBack({
        source: snapshotSource(),
        patch: { name: '  ', unit: '' },
      })
    ).toBeNull();
  });

  it('moves the source store link when the store changes', () => {
    expect(
      planListToMealPlanWriteBack({
        source: snapshotSource('store-old'),
        patch: { storeId: 'store-new' },
      })
    ).toEqual({
      source: { type: 'snapshot', snapshotId: 'snapshot-1' },
      fields: {},
      store: { previousStoreId: 'store-old', nextStoreId: 'store-new' },
    });
  });

  it('clears the source store when the store is cleared', () => {
    expect(
      planListToMealPlanWriteBack({
        source: itemSource('store-old'),
        patch: { storeId: undefined },
      })?.store
    ).toEqual({ previousStoreId: 'store-old', nextStoreId: null });
  });

  it('leaves the store alone when it already matches', () => {
    expect(
      planListToMealPlanWriteBack({
        source: itemSource('store-1'),
        patch: { storeId: 'store-1' },
      })
    ).toBeNull();
  });

  it('writes nothing for unlinked items or empty patches', () => {
    expect(
      planListToMealPlanWriteBack({ source: null, patch: { name: 'Milk' } })
    ).toBeNull();
    expect(
      planListToMealPlanWriteBack({ source: itemSource(), patch: {} })
    ).toBeNull();
  });
});

describe('applyPatchToMealPlanWriteBackSource', () => {
  it('tracks the written store so later edits diff against it', () => {
    expect(
      applyPatchToMealPlanWriteBackSource(snapshotSource('store-old'), {
        storeId: 'store-new',
      })
    ).toEqual(snapshotSource('store-new'));
    expect(
      applyPatchToMealPlanWriteBackSource(snapshotSource('store-old'), {
        storeId: undefined,
      })
    ).toEqual(snapshotSource(null));
    expect(
      applyPatchToMealPlanWriteBackSource(snapshotSource('store-old'), {
        name: 'Basil',
      })
    ).toEqual(snapshotSource('store-old'));
  });
});

describe('buildListToMealPlanWriteBackTransactions', () => {
  it('updates the snapshot row and moves its store link', () => {
    expect(
      buildLinkedGroceryItemWriteBackTransactions({
        source: snapshotSource('store-old'),
        patch: { quantity: 4, storeId: 'store-new' },
        now: NOW,
      })
    ).toEqual([
      {
        operation: 'update',
        namespace: 'meal_plan_recipe_ingredient_snapshots',
        entityId: 'snapshot-1',
        payload: { quantity: 4, isQuantityOverridden: true },
      },
      {
        operation: 'unlink',
        namespace: 'meal_plan_recipe_ingredient_snapshots',
        entityId: 'snapshot-1',
        payload: { store: 'store-old' },
      },
      {
        operation: 'link',
        namespace: 'meal_plan_recipe_ingredient_snapshots',
        entityId: 'snapshot-1',
        payload: { store: 'store-new' },
      },
    ]);
  });

  it('only relinks the snapshot store for a store-only change', () => {
    expect(
      buildLinkedGroceryItemWriteBackTransactions({
        source: snapshotSource(),
        patch: { storeId: 'store-new' },
        now: NOW,
      })
    ).toEqual([
      {
        operation: 'link',
        namespace: 'meal_plan_recipe_ingredient_snapshots',
        entityId: 'snapshot-1',
        payload: { store: 'store-new' },
      },
    ]);
  });

  it('updates a standalone meal plan item and bumps updatedAt', () => {
    expect(
      buildLinkedGroceryItemWriteBackTransactions({
        source: itemSource('store-old'),
        patch: { name: 'Oat milk', storeId: undefined },
        now: NOW,
      })
    ).toEqual([
      {
        operation: 'update',
        namespace: 'meal_plan_items',
        entityId: 'meal-plan-item-1',
        payload: { name: 'Oat milk', updatedAt: NOW },
      },
      {
        operation: 'unlink',
        namespace: 'meal_plan_items',
        entityId: 'meal-plan-item-1',
        payload: { store: 'store-old' },
      },
    ]);
  });

  it('builds nothing without a plan', () => {
    expect(buildListToMealPlanWriteBackTransactions(null, NOW)).toEqual([]);
    expect(
      buildLinkedGroceryItemWriteBackTransactions({
        source: null,
        patch: { name: 'Milk' },
      })
    ).toEqual([]);
  });
});

describe('write-back and meal plan sync', () => {
  it('keeps a quantity edited on the list through a later servings change', () => {
    const plan = planListToMealPlanWriteBack({
      source: snapshotSource(),
      patch: { quantity: 5 },
    });
    const linkedItem = {
      id: 'grocery-1',
      name: 'rice',
      quantity: 5,
      unit: 'cup',
      isChecked: false,
      isDeleted: false,
    };

    const syncPlan = planMealPlanListSync({
      entry: {
        kind: 'recipe',
        id: 'meal-plan-recipe-1',
        recipeId: 'recipe-1',
        // Servings changed after the list edit.
        servings: 4,
        ignoredByGroceryList: false,
        sourceIngredients: [
          { id: 'rice', name: 'rice', quantity: 1, unit: 'cup' },
        ],
        snapshotRows: [
          {
            id: 'snapshot-1',
            sourceRecipeIngredientId: 'rice',
            name: 'rice',
            quantity: 1,
            unit: 'cup',
            isSelected: true,
            isQuantityOverridden: false,
            ...plan?.fields,
            grocery_item: linkedItem,
          },
        ],
      },
    });

    expect(syncPlan.updates).toEqual([]);
    expect(syncPlan.creates).toEqual([]);
    expect(syncPlan.deletes).toEqual([]);
  });
});
