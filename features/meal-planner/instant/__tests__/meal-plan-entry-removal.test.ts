import { describe, expect, it, vi } from 'vitest';

import {
  buildMealPlanEntryRemovalTransactions,
  planMealPlanEntryRemoval,
} from '../build-meal-plan-entry-removal-transactions';
import type {
  MealPlanItemSyncRow,
  MealPlanRecipeSyncRow,
} from '../meal-plan-entry-sync-context';
import type { LinkedGroceryItemForSync } from '../plan-meal-plan-list-sync';

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

const linkedItem = (
  id: string,
  overrides: Partial<LinkedGroceryItemForSync> = {}
): LinkedGroceryItemForSync => ({
  id,
  name: id,
  quantity: 1,
  unit: 'each',
  isChecked: false,
  isDeleted: false,
  ...overrides,
});

const snapshot = (
  sourceId: string,
  grocery_item: LinkedGroceryItemForSync | null,
  isSelected = true
): NonNullable<MealPlanRecipeSyncRow['ingredient_snapshots']>[number] => ({
  id: `snapshot-${sourceId}`,
  sourceRecipeIngredientId: sourceId,
  name: sourceId,
  quantity: 1,
  unit: 'each',
  isSelected,
  isQuantityOverridden: false,
  grocery_item,
});

const recipeRow = (
  overrides: Partial<MealPlanRecipeSyncRow> = {}
): MealPlanRecipeSyncRow => ({
  id: 'meal-plan-recipe-1',
  servings: 1,
  ignoredByGroceryList: false,
  grocery_list: { id: 'list-1' },
  recipe: {
    id: 'recipe-1',
    recipe_ingredients: [
      { id: 'rice', name: 'rice', quantity: 1, unit: 'each' },
      { id: 'salt', name: 'salt', quantity: 1, unit: 'each' },
      { id: 'oil', name: 'oil', quantity: 1, unit: 'each' },
    ],
  },
  ingredient_snapshots: [
    snapshot('rice', linkedItem('grocery-rice')),
    snapshot('salt', linkedItem('grocery-salt', { isChecked: true })),
    snapshot('oil', null, false),
  ],
  ...overrides,
});

const itemRow = (
  overrides: Partial<MealPlanItemSyncRow> = {}
): MealPlanItemSyncRow => ({
  id: 'meal-plan-item-1',
  ignoredByGroceryList: false,
  name: 'Bananas',
  quantity: 6,
  unit: 'each',
  grocery_list: { id: 'list-1' },
  grocery_item: linkedItem('grocery-bananas'),
  ...overrides,
});

describe('planMealPlanEntryRemoval', () => {
  it('deletes unchecked linked items and unlinks checked ones of a meal', () => {
    expect(planMealPlanEntryRemoval({ recipeRows: [recipeRow()] })).toEqual({
      deletes: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-rice' },
          groceryItemId: 'grocery-rice',
        },
      ],
      unlinks: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-salt' },
          groceryItemId: 'grocery-salt',
        },
      ],
    });
  });

  it('deletes an unchecked standalone item and unlinks a checked or soft-deleted one', () => {
    expect(
      planMealPlanEntryRemoval({
        itemRows: [
          itemRow(),
          itemRow({
            id: 'meal-plan-item-2',
            grocery_item: linkedItem('grocery-milk', { isChecked: true }),
          }),
          itemRow({
            id: 'meal-plan-item-3',
            grocery_item: linkedItem('grocery-eggs', { isDeleted: true }),
          }),
          itemRow({ id: 'meal-plan-item-4', grocery_item: null }),
        ],
      })
    ).toEqual({
      deletes: [
        {
          source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
          groceryItemId: 'grocery-bananas',
        },
      ],
      unlinks: [
        {
          source: { type: 'item', mealPlanItemId: 'meal-plan-item-2' },
          groceryItemId: 'grocery-milk',
        },
        {
          source: { type: 'item', mealPlanItemId: 'meal-plan-item-3' },
          groceryItemId: 'grocery-eggs',
        },
      ],
    });
  });

  it('removes linked items of ignored entries and entries whose recipe is gone', () => {
    const plan = planMealPlanEntryRemoval({
      recipeRows: [
        recipeRow({ ignoredByGroceryList: true }),
        recipeRow({
          id: 'meal-plan-recipe-2',
          recipe: null,
          grocery_list: null,
          ingredient_snapshots: [
            snapshot('bread', linkedItem('grocery-bread')),
          ],
        }),
      ],
    });

    expect(plan.deletes.map(change => change.groceryItemId)).toEqual([
      'grocery-rice',
      'grocery-bread',
    ]);
    expect(plan.unlinks.map(change => change.groceryItemId)).toEqual([
      'grocery-salt',
    ]);
  });
});

describe('buildMealPlanEntryRemovalTransactions', () => {
  it('deletes the entries with their unchecked items and unlinks checked ones, keeping the recipe link', () => {
    expect(
      buildMealPlanEntryRemovalTransactions({
        recipeRows: [recipeRow()],
        itemRows: [itemRow()],
      })
    ).toEqual([
      {
        operation: 'delete',
        namespace: 'grocery_items',
        entityId: 'grocery-rice',
        payload: undefined,
      },
      {
        operation: 'delete',
        namespace: 'grocery_items',
        entityId: 'grocery-bananas',
        payload: undefined,
      },
      {
        operation: 'unlink',
        namespace: 'grocery_items',
        entityId: 'grocery-salt',
        payload: { meal_plan_ingredient_snapshot: 'snapshot-salt' },
      },
      {
        operation: 'delete',
        namespace: 'meal_plan_recipes',
        entityId: 'meal-plan-recipe-1',
        payload: undefined,
      },
      {
        operation: 'delete',
        namespace: 'meal_plan_items',
        entityId: 'meal-plan-item-1',
        payload: undefined,
      },
    ]);
  });
});
