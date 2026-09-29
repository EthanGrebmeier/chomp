import { describe, expect, it, vi } from 'vitest';

import { buildMealPlanListReconciliationTransactions } from '../build-meal-plan-list-reconciliation-transactions';
import type { LinkedGroceryItemForSync } from '../plan-meal-plan-list-sync';
import {
  isMealPlanListReconciliationPlanEmpty,
  type ListLinkedGroceryItem,
  type MealPlanItemReconciliationRow,
  type MealPlanRecipeReconciliationRow,
  type PlanMealPlanListReconciliationArgs,
  planMealPlanListReconciliation,
} from '../plan-meal-plan-list-reconciliation';

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
  name: 'rice',
  quantity: 1,
  unit: 'cup',
  isChecked: false,
  isDeleted: false,
  ...overrides,
});

const snapshot = (
  sourceId: string,
  grocery_item: LinkedGroceryItemForSync | null,
  isSelected = true
): NonNullable<
  MealPlanRecipeReconciliationRow['ingredient_snapshots']
>[number] => ({
  id: `snapshot-${sourceId}`,
  sourceRecipeIngredientId: sourceId,
  name: sourceId,
  quantity: 1,
  unit: 'cup',
  isSelected,
  isQuantityOverridden: false,
  grocery_item,
});

const recipeRow = (
  overrides: Partial<MealPlanRecipeReconciliationRow> = {}
): MealPlanRecipeReconciliationRow => ({
  id: 'meal-1',
  servings: 1,
  ignoredByGroceryList: false,
  recipe: {
    id: 'recipe-1',
    recipe_ingredients: [
      { id: 'rice', name: 'rice', quantity: 1, unit: 'cup' },
      { id: 'beans', name: 'beans', quantity: 2, unit: 'can' },
    ],
  },
  ingredient_snapshots: [
    snapshot('rice', linkedItem('item-rice')),
    snapshot('beans', linkedItem('item-beans', { name: 'beans' })),
  ],
  ...overrides,
});

const itemRow = (
  overrides: Partial<MealPlanItemReconciliationRow> = {}
): MealPlanItemReconciliationRow => ({
  id: 'plan-item-1',
  name: 'milk',
  quantity: 1,
  unit: 'gallon',
  ignoredByGroceryList: false,
  grocery_item: linkedItem('item-milk', { name: 'milk', unit: 'gallon' }),
  ...overrides,
});

const onList = (
  item: LinkedGroceryItemForSync,
  source: { snapshotId: string } | { mealPlanItemId: string }
): ListLinkedGroceryItem => ({
  ...item,
  ...('snapshotId' in source
    ? { meal_plan_ingredient_snapshot: { id: source.snapshotId } }
    : { meal_plan_item: { id: source.mealPlanItemId } }),
});

let idCounter = 0;
const plan = (overrides: Partial<PlanMealPlanListReconciliationArgs> = {}) => {
  idCounter = 0;
  return planMealPlanListReconciliation({
    recipeRows: [],
    itemRows: [],
    linkedGroceryItems: [],
    createId: () => `created-${++idCounter}`,
    ...overrides,
  });
};

describe('planMealPlanListReconciliation', () => {
  it('plans nothing when every selected source has its linked item', () => {
    const result = plan({
      recipeRows: [recipeRow()],
      itemRows: [itemRow()],
      linkedGroceryItems: [
        onList(linkedItem('item-rice'), { snapshotId: 'snapshot-rice' }),
        onList(linkedItem('item-milk'), { mealPlanItemId: 'plan-item-1' }),
      ],
    });

    expect(isMealPlanListReconciliationPlanEmpty(result)).toBe(true);
  });

  it('creates a missing linked item for a selected ingredient', () => {
    const result = plan({
      recipeRows: [
        recipeRow({
          ingredient_snapshots: [
            snapshot('rice', null),
            snapshot('beans', linkedItem('item-beans')),
          ],
        }),
      ],
    });

    expect(result.listSync.creates).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-rice' },
        recipeId: 'recipe-1',
        fields: {
          name: 'rice',
          quantity: 1,
          unit: 'cup',
          notes: null,
          category: null,
          storeId: null,
        },
      },
    ]);
    expect(result.listSync.deletes).toEqual([]);
  });

  it('creates a missing linked item for a standalone item', () => {
    const result = plan({ itemRows: [itemRow({ grocery_item: null })] });

    expect(result.listSync.creates).toHaveLength(1);
    expect(result.listSync.creates[0].source).toEqual({
      type: 'item',
      mealPlanItemId: 'plan-item-1',
    });
  });

  it('removes extra unchecked duplicates of a source', () => {
    const result = plan({
      recipeRows: [recipeRow()],
      linkedGroceryItems: [
        onList(linkedItem('item-rice'), { snapshotId: 'snapshot-rice' }),
        onList(linkedItem('item-rice-dup'), { snapshotId: 'snapshot-rice' }),
      ],
    });

    expect(result.listSync.creates).toEqual([]);
    expect(result.listSync.deletes).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-rice' },
        groceryItemId: 'item-rice-dup',
      },
    ]);
  });

  it('keeps a checked duplicate over an unchecked one', () => {
    const result = plan({
      itemRows: [itemRow()],
      linkedGroceryItems: [
        onList(linkedItem('item-milk-checked', { isChecked: true }), {
          mealPlanItemId: 'plan-item-1',
        }),
      ],
    });

    expect(result.listSync.deletes).toEqual([
      {
        source: { type: 'item', mealPlanItemId: 'plan-item-1' },
        groceryItemId: 'item-milk',
      },
    ]);
    expect(result.listSync.unlinks).toEqual([]);
  });

  it('does not re-create items that are checked or soft-deleted', () => {
    const result = plan({
      recipeRows: [
        recipeRow({
          ingredient_snapshots: [
            snapshot('rice', linkedItem('item-rice', { isChecked: true })),
            snapshot('beans', linkedItem('item-beans', { isDeleted: true })),
          ],
        }),
      ],
      itemRows: [
        itemRow({ grocery_item: linkedItem('item-milk', { isDeleted: true }) }),
      ],
    });

    expect(isMealPlanListReconciliationPlanEmpty(result)).toBe(true);
  });

  it('skips ignored entries: nothing is created or backfilled', () => {
    const result = plan({
      recipeRows: [
        recipeRow({ ignoredByGroceryList: true, ingredient_snapshots: [] }),
      ],
      itemRows: [itemRow({ ignoredByGroceryList: true, grocery_item: null })],
    });

    expect(isMealPlanListReconciliationPlanEmpty(result)).toBe(true);
  });

  it('removes leftover unchecked items of an ignored entry', () => {
    const result = plan({
      itemRows: [itemRow({ ignoredByGroceryList: true })],
    });

    expect(result.listSync.creates).toEqual([]);
    expect(result.listSync.deletes).toEqual([
      {
        source: { type: 'item', mealPlanItemId: 'plan-item-1' },
        groceryItemId: 'item-milk',
      },
    ]);
  });

  it('does not create items for deselected ingredients', () => {
    const result = plan({
      recipeRows: [
        recipeRow({
          ingredient_snapshots: [
            snapshot('rice', null, false),
            snapshot('beans', linkedItem('item-beans')),
          ],
        }),
      ],
    });

    expect(isMealPlanListReconciliationPlanEmpty(result)).toBe(true);
  });

  it('backfills snapshot rows and their linked items for new ingredients', () => {
    const result = plan({
      recipeRows: [
        recipeRow({
          ingredient_snapshots: [snapshot('rice', linkedItem('item-rice'))],
        }),
      ],
    });

    expect(result.snapshotRowsToCreate).toEqual([
      {
        mealPlanRecipeId: 'meal-1',
        rows: [
          expect.objectContaining({
            id: 'created-1',
            sourceRecipeIngredientId: 'beans',
            isSelected: true,
          }),
        ],
      },
    ]);
    expect(result.listSync.creates).toEqual([
      expect.objectContaining({
        source: { type: 'snapshot', snapshotId: 'created-1' },
        fields: expect.objectContaining({ name: 'beans', quantity: 2 }),
      }),
    ]);
  });

  it('deletes snapshot rows of removed ingredients with their unchecked items', () => {
    const result = plan({
      recipeRows: [
        recipeRow({
          ingredient_snapshots: [
            snapshot('rice', linkedItem('item-rice')),
            snapshot('beans', linkedItem('item-beans')),
            snapshot('gone', linkedItem('item-gone')),
            snapshot(
              'gone-checked',
              linkedItem('item-gone-checked', { isChecked: true })
            ),
          ],
        }),
      ],
    });

    expect(result.snapshotRowIdsToDelete).toEqual([
      'snapshot-gone',
      'snapshot-gone-checked',
    ]);
    expect(result.listSync.deletes).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-gone' },
        groceryItemId: 'item-gone',
      },
    ]);
    expect(result.listSync.unlinks).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-gone-checked' },
        groceryItemId: 'item-gone-checked',
      },
    ]);
  });

  it('drops items linked to a source that is not on the meal plan', () => {
    const result = plan({
      linkedGroceryItems: [
        onList(linkedItem('item-orphan'), { snapshotId: 'snapshot-missing' }),
        onList(linkedItem('item-orphan-checked', { isChecked: true }), {
          mealPlanItemId: 'plan-item-missing',
        }),
      ],
    });

    expect(result.listSync.deletes).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-missing' },
        groceryItemId: 'item-orphan',
      },
    ]);
    expect(result.listSync.unlinks).toEqual([
      {
        source: { type: 'item', mealPlanItemId: 'plan-item-missing' },
        groceryItemId: 'item-orphan-checked',
      },
    ]);
  });

  it('leaves entries whose recipe is not visible alone', () => {
    const result = plan({
      recipeRows: [
        recipeRow({
          recipe: null,
          ingredient_snapshots: [snapshot('rice', null)],
        }),
      ],
      linkedGroceryItems: [
        onList(linkedItem('item-rice'), { snapshotId: 'snapshot-rice' }),
      ],
    });

    expect(isMealPlanListReconciliationPlanEmpty(result)).toBe(true);
  });

  it('never updates linked item fields', () => {
    const result = plan({
      itemRows: [
        itemRow({
          grocery_item: linkedItem('item-milk', { name: 'oat milk' }),
        }),
      ],
    });

    expect(isMealPlanListReconciliationPlanEmpty(result)).toBe(true);
  });

  it('applies the default store to created items', () => {
    const result = plan({
      itemRows: [itemRow({ grocery_item: null })],
      defaultStore: { id: 'store-default' },
    });

    expect(result.listSync.creates[0].fields.storeId).toBe('store-default');
  });
});

describe('buildMealPlanListReconciliationTransactions', () => {
  it('builds no transactions for an empty plan', () => {
    expect(
      buildMealPlanListReconciliationTransactions({
        listId: 'list-1',
        plan: plan({ recipeRows: [recipeRow()], itemRows: [itemRow()] }),
      })
    ).toEqual([]);
  });

  it('creates snapshot rows before the linked items that point at them', () => {
    const transactions = buildMealPlanListReconciliationTransactions({
      listId: 'list-1',
      now: '2026-01-01T00:00:00.000Z',
      plan: plan({
        recipeRows: [
          recipeRow({
            ingredient_snapshots: [
              snapshot('rice', linkedItem('item-rice')),
              snapshot('gone', linkedItem('item-gone')),
            ],
          }),
        ],
      }),
    }) as unknown as {
      operation: string;
      namespace: string;
      entityId: string;
      payload?: unknown;
    }[];

    const snapshotCreate = transactions.findIndex(
      t =>
        t.namespace === 'meal_plan_recipe_ingredient_snapshots' &&
        t.entityId === 'created-1' &&
        t.operation === 'update'
    );
    const itemLink = transactions.findIndex(
      t =>
        t.namespace === 'grocery_items' &&
        t.operation === 'link' &&
        JSON.stringify(t.payload) ===
          JSON.stringify({ meal_plan_ingredient_snapshot: 'created-1' })
    );
    expect(snapshotCreate).toBeGreaterThanOrEqual(0);
    expect(itemLink).toBeGreaterThan(snapshotCreate);
    expect(transactions).toContainEqual({
      operation: 'delete',
      namespace: 'grocery_items',
      entityId: 'item-gone',
      payload: undefined,
    });
    expect(transactions).toContainEqual({
      operation: 'delete',
      namespace: 'meal_plan_recipe_ingredient_snapshots',
      entityId: 'snapshot-gone',
      payload: undefined,
    });
  });
});
