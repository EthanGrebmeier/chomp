import { describe, expect, it, vi } from 'vitest';

import { buildRecipeIngredientEditPropagationTransactions } from '../build-recipe-ingredient-edit-propagation-transactions';
import type { MealPlanRecipeSyncRow } from '../meal-plan-entry-sync-context';
import type { LinkedGroceryItemForSync } from '../plan-meal-plan-list-sync';
import {
  type PlanRecipeIngredientEditPropagationArgs,
  planRecipeIngredientEditPropagation,
  planSnapshotRowFollowUpdate,
} from '../plan-recipe-ingredient-edit-propagation';

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
    id: () => 'new-item-id',
    tx: new Proxy(
      {},
      { get: (_target, namespace: string) => createNamespace(namespace) }
    ),
  };
});

type SnapshotRow = NonNullable<
  MealPlanRecipeSyncRow['ingredient_snapshots']
>[number];

const linkedItem = (
  id: string,
  overrides: Partial<LinkedGroceryItemForSync> = {}
): LinkedGroceryItemForSync => ({
  id,
  name: 'rice',
  quantity: 2,
  unit: 'cup',
  isChecked: false,
  isDeleted: false,
  ...overrides,
});

const riceSnapshot = (
  mealId: string,
  overrides: Partial<SnapshotRow> = {}
): SnapshotRow => ({
  id: `${mealId}-snapshot-rice`,
  sourceRecipeIngredientId: 'rice',
  name: 'rice',
  quantity: 1,
  unit: 'cup',
  isSelected: true,
  isQuantityOverridden: false,
  grocery_item: linkedItem(`${mealId}-item-rice`),
  ...overrides,
});

const recipeRow = (
  mealId: string,
  overrides: Partial<MealPlanRecipeSyncRow> = {}
): MealPlanRecipeSyncRow => ({
  id: mealId,
  servings: 2,
  ignoredByGroceryList: false,
  grocery_list: { id: 'list-1' },
  recipe: {
    id: 'recipe-1',
    recipe_ingredients: [
      { id: 'rice', name: 'rice', quantity: 1, unit: 'cup' },
      { id: 'beans', name: 'beans', quantity: 1, unit: 'can' },
    ],
  },
  ingredient_snapshots: [
    riceSnapshot(mealId),
    {
      id: `${mealId}-snapshot-beans`,
      sourceRecipeIngredientId: 'beans',
      // Drifted on purpose: edits to rice must not touch beans.
      name: 'beans',
      quantity: 1,
      unit: 'can',
      isSelected: true,
      isQuantityOverridden: false,
      grocery_item: linkedItem(`${mealId}-item-beans`, {
        name: 'stale beans',
        unit: 'can',
      }),
    },
  ],
  ...overrides,
});

const plan = (
  overrides: Partial<PlanRecipeIngredientEditPropagationArgs> &
    Pick<PlanRecipeIngredientEditPropagationArgs, 'edit'>
) => {
  let counter = 0;
  return planRecipeIngredientEditPropagation({
    recipeRows: [recipeRow('meal-1')],
    createId: () => `snapshot-new-${++counter}`,
    ...overrides,
  });
};

const oil = { id: 'oil', name: 'oil', quantity: 1, unit: 'tbsp' };

describe('planRecipeIngredientEditPropagation: add', () => {
  it('adds a selected snapshot row and a linked list row to each planned meal', () => {
    const plans = plan({
      recipeRows: [
        recipeRow('meal-1'),
        recipeRow('meal-2', { grocery_list: { id: 'list-2' } }),
      ],
      edit: { type: 'add', ingredient: oil },
    });

    expect(plans).toHaveLength(2);
    expect(plans.map(({ listId }) => listId)).toEqual(['list-1', 'list-2']);
    expect(plans[0].snapshotRowsToCreate).toEqual([
      expect.objectContaining({
        id: 'snapshot-new-1',
        sourceRecipeIngredientId: 'oil',
        isSelected: true,
        isQuantityOverridden: false,
      }),
    ]);
    expect(plans[0].listSync).toEqual({
      creates: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-new-1' },
          recipeId: 'recipe-1',
          fields: {
            name: 'oil',
            quantity: 2,
            unit: 'tbsp',
            notes: null,
            category: null,
            storeId: null,
          },
        },
      ],
      updates: [],
      deletes: [],
      unlinks: [],
    });
  });

  it('skips planned meals that are meal plan only', () => {
    const plans = plan({
      recipeRows: [recipeRow('meal-1', { ignoredByGroceryList: true })],
      edit: { type: 'add', ingredient: oil },
    });

    expect(plans).toEqual([]);
  });

  it('applies the default store to the new list row', () => {
    const [entryPlan] = plan({
      edit: { type: 'add', ingredient: oil },
      defaultStore: { id: 'store-default', name: 'Default' },
    });

    expect(entryPlan.listSync.creates[0].fields.storeId).toBe('store-default');
  });

  it('skips rows without a list or recipe', () => {
    const plans = plan({
      recipeRows: [
        recipeRow('meal-1', { grocery_list: null }),
        recipeRow('meal-2', { recipe: null }),
      ],
      edit: { type: 'add', ingredient: oil },
    });

    expect(plans).toEqual([]);
  });
});

describe('planRecipeIngredientEditPropagation: remove', () => {
  it('deletes the snapshot row and its unchecked list row', () => {
    const [entryPlan] = plan({
      edit: { type: 'remove', ingredientId: 'rice' },
    });

    expect(entryPlan.snapshotRowIdsToDelete).toEqual(['meal-1-snapshot-rice']);
    expect(entryPlan.listSync).toEqual({
      creates: [],
      updates: [],
      deletes: [
        {
          source: { type: 'snapshot', snapshotId: 'meal-1-snapshot-rice' },
          groceryItemId: 'meal-1-item-rice',
        },
      ],
      unlinks: [],
    });
  });

  it('keeps a checked list row, unlinking it from the meal plan', () => {
    const [entryPlan] = plan({
      recipeRows: [
        recipeRow('meal-1', {
          ingredient_snapshots: [
            riceSnapshot('meal-1', {
              grocery_item: linkedItem('meal-1-item-rice', { isChecked: true }),
            }),
          ],
        }),
      ],
      edit: { type: 'remove', ingredientId: 'rice' },
    });

    expect(entryPlan.snapshotRowIdsToDelete).toEqual(['meal-1-snapshot-rice']);
    expect(entryPlan.listSync.deletes).toEqual([]);
    expect(entryPlan.listSync.unlinks).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'meal-1-snapshot-rice' },
        groceryItemId: 'meal-1-item-rice',
      },
    ]);
  });

  it('deletes the snapshot row of a meal plan only entry too', () => {
    const [entryPlan] = plan({
      recipeRows: [
        recipeRow('meal-1', {
          ignoredByGroceryList: true,
          ingredient_snapshots: [
            riceSnapshot('meal-1', { grocery_item: null }),
          ],
        }),
      ],
      edit: { type: 'remove', ingredientId: 'rice' },
    });

    expect(entryPlan.snapshotRowIdsToDelete).toEqual(['meal-1-snapshot-rice']);
    expect(entryPlan.listSync.deletes).toEqual([]);
  });
});

describe('planRecipeIngredientEditPropagation: update', () => {
  const brownRice = {
    id: 'rice',
    name: 'brown rice',
    quantity: 3,
    unit: 'cup',
    notes: 'rinsed',
    store: { id: 'store-2' },
  };

  it('updates snapshot rows and unchecked list rows that are not overridden', () => {
    const [entryPlan] = plan({
      edit: { type: 'update', ingredient: brownRice },
    });

    expect(entryPlan.snapshotRowUpdates).toEqual([
      {
        snapshotRowId: 'meal-1-snapshot-rice',
        fields: {
          name: 'brown rice',
          quantity: 3,
          unit: 'cup',
          notes: 'rinsed',
          category: null,
        },
        storeId: 'store-2',
        previousStoreId: null,
      },
    ]);
    expect(entryPlan.listSync).toEqual({
      creates: [],
      updates: [
        {
          source: { type: 'snapshot', snapshotId: 'meal-1-snapshot-rice' },
          groceryItemId: 'meal-1-item-rice',
          fields: {
            name: 'brown rice',
            quantity: 6,
            unit: 'cup',
            notes: 'rinsed',
            category: null,
            storeId: 'store-2',
          },
          previousStoreId: null,
        },
      ],
      deletes: [],
      unlinks: [],
    });
  });

  it('keeps overridden snapshot fields', () => {
    const [entryPlan] = plan({
      recipeRows: [
        recipeRow('meal-1', {
          ingredient_snapshots: [
            riceSnapshot('meal-1', {
              name: 'jasmine rice',
              quantity: 5,
              isQuantityOverridden: true,
              grocery_item: linkedItem('meal-1-item-rice', {
                name: 'jasmine rice',
                quantity: 5,
              }),
            }),
          ],
        }),
      ],
      edit: { type: 'update', ingredient: brownRice },
    });

    expect(entryPlan.snapshotRowUpdates[0].fields).toMatchObject({
      name: 'jasmine rice',
      quantity: 5,
      notes: 'rinsed',
    });
    expect(entryPlan.listSync.updates[0].fields).toMatchObject({
      name: 'jasmine rice',
      quantity: 5,
      notes: 'rinsed',
    });
  });

  it('leaves checked list rows alone', () => {
    const [entryPlan] = plan({
      recipeRows: [
        recipeRow('meal-1', {
          ingredient_snapshots: [
            riceSnapshot('meal-1', {
              grocery_item: linkedItem('meal-1-item-rice', { isChecked: true }),
            }),
          ],
        }),
      ],
      edit: { type: 'update', ingredient: brownRice },
    });

    expect(entryPlan.snapshotRowUpdates).toHaveLength(1);
    expect(entryPlan.listSync).toEqual({
      creates: [],
      updates: [],
      deletes: [],
      unlinks: [],
    });
  });

  it('updates the snapshot of a meal plan only entry without touching the list', () => {
    const [entryPlan] = plan({
      recipeRows: [
        recipeRow('meal-1', {
          ignoredByGroceryList: true,
          ingredient_snapshots: [
            riceSnapshot('meal-1', { grocery_item: null }),
          ],
        }),
      ],
      edit: { type: 'update', ingredient: brownRice },
    });

    expect(entryPlan.snapshotRowUpdates).toHaveLength(1);
    expect(entryPlan.listSync.creates).toEqual([]);
    expect(entryPlan.listSync.updates).toEqual([]);
  });

  it('does not touch other ingredients, even when they drifted', () => {
    const [entryPlan] = plan({
      edit: { type: 'update', ingredient: brownRice },
    });

    const touched = [
      ...entryPlan.listSync.updates,
      ...entryPlan.listSync.deletes,
    ].map(change => change.groceryItemId);
    expect(touched).toEqual(['meal-1-item-rice']);
  });

  it('plans nothing when the edit changes nothing', () => {
    const plans = plan({
      edit: {
        type: 'update',
        ingredient: { id: 'rice', name: ' rice ', quantity: 1, unit: 'cup' },
      },
    });

    expect(plans).toEqual([]);
  });
});

describe('planSnapshotRowFollowUpdate', () => {
  const previous = {
    id: 'rice',
    name: 'rice',
    quantity: 1,
    unit: 'cup',
    store: { id: 'store-1' },
  };

  it('keeps a snapshot store that differs from the recipe store', () => {
    const update = planSnapshotRowFollowUpdate(
      { ...riceSnapshot('meal-1'), store: { id: 'store-own' } },
      previous,
      { ...previous, quantity: 2, store: { id: 'store-2' } }
    );

    expect(update).toMatchObject({
      storeId: 'store-own',
      previousStoreId: 'store-own',
      fields: { quantity: 2 },
    });
  });
});

describe('buildRecipeIngredientEditPropagationTransactions', () => {
  it('creates snapshot rows before their list rows', () => {
    const transactions = buildRecipeIngredientEditPropagationTransactions({
      plans: plan({ edit: { type: 'add', ingredient: oil } }),
      now: '2026-01-01T00:00:00.000Z',
    }) as unknown as { namespace: string; operation: string }[];

    const firstGroceryItem = transactions.findIndex(
      chunk => chunk.namespace === 'grocery_items'
    );
    const lastSnapshot = transactions.findLastIndex(
      chunk => chunk.namespace === 'meal_plan_recipe_ingredient_snapshots'
    );
    expect(lastSnapshot).toBeLessThan(firstGroceryItem);
  });

  it('detaches list rows before deleting their snapshot rows', () => {
    const transactions = buildRecipeIngredientEditPropagationTransactions({
      plans: plan({ edit: { type: 'remove', ingredientId: 'rice' } }),
    }) as unknown as {
      namespace: string;
      operation: string;
      entityId: string;
    }[];

    expect(transactions).toEqual([
      expect.objectContaining({
        namespace: 'grocery_items',
        operation: 'delete',
        entityId: 'meal-1-item-rice',
      }),
      expect.objectContaining({
        namespace: 'meal_plan_recipe_ingredient_snapshots',
        operation: 'delete',
        entityId: 'meal-1-snapshot-rice',
      }),
    ]);
  });

  it('moves the snapshot store link when the store follows the recipe', () => {
    const transactions = buildRecipeIngredientEditPropagationTransactions({
      plans: plan({
        edit: {
          type: 'update',
          ingredient: {
            id: 'rice',
            name: 'rice',
            quantity: 1,
            unit: 'cup',
            store: { id: 'store-2' },
          },
        },
      }),
    });

    expect(transactions).toContainEqual({
      operation: 'link',
      namespace: 'meal_plan_recipe_ingredient_snapshots',
      entityId: 'meal-1-snapshot-rice',
      payload: { store: 'store-2' },
    });
  });
});
