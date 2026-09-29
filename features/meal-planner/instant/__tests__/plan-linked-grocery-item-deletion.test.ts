import { describe, expect, it, vi } from 'vitest';

import { buildLinkedGroceryItemDeletionTransactions } from '../build-linked-grocery-item-deletion-transactions';
import {
  type GroceryItemForDeletion,
  planLinkedGroceryItemDeletion,
} from '../plan-linked-grocery-item-deletion';

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
    tx: new Proxy(
      {},
      { get: (_target, namespace: string) => createNamespace(namespace) }
    ),
  };
});

const NOW = '2026-01-01T00:00:00.000Z';

type RecipeEntry = NonNullable<
  NonNullable<
    GroceryItemForDeletion['meal_plan_ingredient_snapshot']
  >['meal_plan_recipe']
>;

const recipeEntry = (
  id: string,
  rows: { id: string; isSelected: boolean }[],
  ignoredByGroceryList = false
): RecipeEntry => ({ id, ignoredByGroceryList, ingredient_snapshots: rows });

const recipeItem = (
  id: string,
  snapshotId: string,
  entry: RecipeEntry,
  overrides: Partial<GroceryItemForDeletion> = {}
): GroceryItemForDeletion => ({
  id,
  isChecked: false,
  isDeleted: false,
  meal_plan_ingredient_snapshot: { id: snapshotId, meal_plan_recipe: entry },
  ...overrides,
});

const threeIngredientMeal = recipeEntry('meal-1', [
  { id: 'snap-1', isSelected: true },
  { id: 'snap-2', isSelected: true },
  { id: 'snap-3', isSelected: true },
]);

describe('planLinkedGroceryItemDeletion', () => {
  it('deselects the ingredient when one of several linked rows is deleted', () => {
    const plan = planLinkedGroceryItemDeletion([
      recipeItem('item-1', 'snap-1', threeIngredientMeal),
    ]);

    expect(plan).toEqual({
      groceryItemIdsToSoftDelete: [],
      groceryItemIdsToRemove: ['item-1'],
      snapshotRowIdsToDeselect: ['snap-1'],
      entriesToIgnore: [],
    });
  });

  it('ignores the meal and keeps the last ingredient selected when it is deleted', () => {
    const meal = recipeEntry('meal-1', [
      { id: 'snap-1', isSelected: false },
      { id: 'snap-2', isSelected: false },
      { id: 'snap-3', isSelected: true },
    ]);

    const plan = planLinkedGroceryItemDeletion([
      recipeItem('item-3', 'snap-3', meal),
    ]);

    expect(plan.snapshotRowIdsToDeselect).toEqual([]);
    expect(plan.entriesToIgnore).toEqual([{ type: 'recipe', id: 'meal-1' }]);
    expect(plan.groceryItemIdsToRemove).toEqual(['item-3']);
  });

  it('ignores the meal and keeps the selection when every remaining row is deleted at once', () => {
    const plan = planLinkedGroceryItemDeletion([
      recipeItem('item-1', 'snap-1', threeIngredientMeal),
      recipeItem('item-2', 'snap-2', threeIngredientMeal),
      recipeItem('item-3', 'snap-3', threeIngredientMeal),
    ]);

    expect(plan.snapshotRowIdsToDeselect).toEqual([]);
    expect(plan.entriesToIgnore).toEqual([{ type: 'recipe', id: 'meal-1' }]);
    expect(plan.groceryItemIdsToRemove).toEqual(['item-1', 'item-2', 'item-3']);
  });

  it('counts a checked selected ingredient as still left', () => {
    const plan = planLinkedGroceryItemDeletion([
      recipeItem('item-1', 'snap-1', threeIngredientMeal),
      recipeItem('item-2', 'snap-2', threeIngredientMeal),
    ]);

    expect(plan.snapshotRowIdsToDeselect).toEqual(['snap-1', 'snap-2']);
    expect(plan.entriesToIgnore).toEqual([]);
  });

  it('ignores a standalone planned item', () => {
    const plan = planLinkedGroceryItemDeletion([
      {
        id: 'item-1',
        isChecked: false,
        meal_plan_item: { id: 'planned-1', ignoredByGroceryList: false },
      },
    ]);

    expect(plan).toEqual({
      groceryItemIdsToSoftDelete: [],
      groceryItemIdsToRemove: ['item-1'],
      snapshotRowIdsToDeselect: [],
      entriesToIgnore: [{ type: 'item', id: 'planned-1' }],
    });
  });

  it('applies bulk deletes across several meals per entry', () => {
    const otherMeal = recipeEntry('meal-2', [
      { id: 'other-1', isSelected: true },
    ]);

    const plan = planLinkedGroceryItemDeletion([
      recipeItem('item-1', 'snap-1', threeIngredientMeal),
      recipeItem('item-4', 'other-1', otherMeal),
      {
        id: 'item-5',
        isChecked: false,
        meal_plan_item: { id: 'planned-1' },
      },
      { id: 'plain', isChecked: false },
    ]);

    expect(plan.snapshotRowIdsToDeselect).toEqual(['snap-1']);
    expect(plan.entriesToIgnore).toEqual([
      { type: 'item', id: 'planned-1' },
      { type: 'recipe', id: 'meal-2' },
    ]);
    expect(plan.groceryItemIdsToRemove).toEqual(['item-1', 'item-4', 'item-5']);
    expect(plan.groceryItemIdsToSoftDelete).toEqual(['plain']);
  });

  it('leaves the meal plan alone for checked linked items', () => {
    const plan = planLinkedGroceryItemDeletion([
      recipeItem('item-1', 'snap-1', threeIngredientMeal, { isChecked: true }),
      {
        id: 'item-2',
        isChecked: true,
        meal_plan_item: { id: 'planned-1' },
      },
    ]);

    expect(plan).toEqual({
      groceryItemIdsToSoftDelete: ['item-1', 'item-2'],
      groceryItemIdsToRemove: [],
      snapshotRowIdsToDeselect: [],
      entriesToIgnore: [],
    });
  });

  it('leaves entries that are already meal plan only alone', () => {
    const ignoredMeal = recipeEntry(
      'meal-1',
      [{ id: 'snap-1', isSelected: true }],
      true
    );

    const plan = planLinkedGroceryItemDeletion([
      recipeItem('item-1', 'snap-1', ignoredMeal),
      {
        id: 'item-2',
        isChecked: false,
        meal_plan_item: { id: 'planned-1', ignoredByGroceryList: true },
      },
    ]);

    expect(plan.groceryItemIdsToRemove).toEqual(['item-1', 'item-2']);
    expect(plan.snapshotRowIdsToDeselect).toEqual([]);
    expect(plan.entriesToIgnore).toEqual([]);
  });

  it('soft deletes unlinked items and skips ones already deleted', () => {
    const plan = planLinkedGroceryItemDeletion([
      { id: 'plain', isChecked: false },
      { id: 'gone', isChecked: false, isDeleted: true },
    ]);

    expect(plan.groceryItemIdsToSoftDelete).toEqual(['plain']);
    expect(plan.groceryItemIdsToRemove).toEqual([]);
  });
});

describe('buildLinkedGroceryItemDeletionTransactions', () => {
  it('writes item deletes, deselects and ignores', () => {
    const transactions = buildLinkedGroceryItemDeletionTransactions(
      {
        groceryItemIdsToSoftDelete: ['plain'],
        groceryItemIdsToRemove: ['linked'],
        snapshotRowIdsToDeselect: ['snap-1'],
        entriesToIgnore: [
          { type: 'recipe', id: 'meal-1' },
          { type: 'item', id: 'planned-1' },
        ],
      },
      NOW
    );

    expect(transactions).toEqual([
      {
        operation: 'update',
        namespace: 'grocery_items',
        entityId: 'plain',
        payload: { isDeleted: true, deletedAt: NOW, updatedAt: NOW },
      },
      {
        operation: 'delete',
        namespace: 'grocery_items',
        entityId: 'linked',
        payload: undefined,
      },
      {
        operation: 'update',
        namespace: 'meal_plan_recipe_ingredient_snapshots',
        entityId: 'snap-1',
        payload: { isSelected: false },
      },
      {
        operation: 'update',
        namespace: 'meal_plan_recipes',
        entityId: 'meal-1',
        payload: { ignoredByGroceryList: true, updatedAt: NOW },
      },
      {
        operation: 'update',
        namespace: 'meal_plan_items',
        entityId: 'planned-1',
        payload: { ignoredByGroceryList: true, updatedAt: NOW },
      },
    ]);
  });
});
