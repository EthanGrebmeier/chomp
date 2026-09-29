import { describe, expect, it, vi } from 'vitest';

import { buildMealPlanListSyncTransactions } from '../build-meal-plan-list-sync-transactions';
import {
  type LinkedGroceryItemForSync,
  type MealPlanItemEntryForSync,
  type MealPlanRecipeEntryForSync,
  type MealPlanSnapshotRowForSync,
  planMealPlanListSync,
} from '../plan-meal-plan-list-sync';

type Transaction = {
  operation: string;
  namespace: string;
  entityId: string;
  payload?: unknown;
};

vi.mock('@instantdb/react-native', () => {
  let nextId = 0;
  const createNamespace = (namespace: string) =>
    new Proxy(
      {},
      {
        get: (_target, entityId: string) =>
          Object.fromEntries(
            ['update', 'link', 'unlink', 'delete'].map(operation => [
              operation,
              (payload?: unknown): Transaction => ({
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
    id: () => `new-${++nextId}`,
    tx: new Proxy(
      {},
      { get: (_target, namespace: string) => createNamespace(namespace) }
    ),
  };
});

const sourceIngredients: MealPlanRecipeEntryForSync['sourceIngredients'] = [
  {
    id: 'source-rice',
    name: 'Rice',
    quantity: 0.5,
    unit: 'cup',
    category: 'Pantry',
    notes: null,
    store: { id: 'store-costco', name: 'Costco' },
  },
  {
    id: 'source-salt',
    name: 'Salt',
    quantity: 1,
    unit: 'tsp',
    category: 'Pantry',
    notes: null,
  },
];

const snapshotRow = (
  sourceId: string,
  overrides: Partial<MealPlanSnapshotRowForSync> = {}
): MealPlanSnapshotRowForSync => {
  const source = sourceIngredients.find(
    ingredient => ingredient.id === sourceId
  );
  if (!source) throw new Error(`Unknown source ${sourceId}`);
  return {
    id: `snapshot-${sourceId}`,
    sourceRecipeIngredientId: sourceId,
    name: source.name,
    quantity: source.quantity,
    unit: source.unit,
    category: source.category,
    notes: source.notes,
    store: source.store,
    isSelected: true,
    isQuantityOverridden: false,
    ...overrides,
  };
};

const linkedItem = (
  overrides: Partial<LinkedGroceryItemForSync> = {}
): LinkedGroceryItemForSync => ({
  id: 'grocery-1',
  name: 'Rice',
  quantity: 1,
  unit: 'cup',
  category: 'Pantry',
  notes: null,
  isChecked: false,
  isDeleted: false,
  store: { id: 'store-costco' },
  ...overrides,
});

const recipeEntry = (
  overrides: Partial<MealPlanRecipeEntryForSync> = {}
): MealPlanRecipeEntryForSync => ({
  kind: 'recipe',
  id: 'meal-plan-recipe-1',
  recipeId: 'recipe-1',
  servings: 2,
  ignoredByGroceryList: false,
  sourceIngredients,
  snapshotRows: [snapshotRow('source-rice'), snapshotRow('source-salt')],
  ...overrides,
});

const itemEntry = (
  overrides: Partial<MealPlanItemEntryForSync> = {}
): MealPlanItemEntryForSync => ({
  kind: 'item',
  id: 'meal-plan-item-1',
  ignoredByGroceryList: false,
  name: 'Bananas',
  quantity: 6,
  unit: 'each',
  category: 'Produce',
  notes: null,
  store: null,
  ...overrides,
});

const emptyPlan = { creates: [], updates: [], deletes: [], unlinks: [] };

describe('planMealPlanListSync — recipe entries', () => {
  it('creates one servings-scaled item per selected ingredient', () => {
    const plan = planMealPlanListSync({ entry: recipeEntry() });

    expect(plan.creates).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
        recipeId: 'recipe-1',
        fields: {
          name: 'Rice',
          quantity: 1,
          unit: 'cup',
          category: 'Pantry',
          notes: null,
          storeId: 'store-costco',
        },
      },
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-source-salt' },
        recipeId: 'recipe-1',
        fields: {
          name: 'Salt',
          quantity: 2,
          unit: 'tsp',
          category: 'Pantry',
          notes: null,
          storeId: null,
        },
      },
    ]);
    expect(plan.updates).toEqual([]);
    expect(plan.deletes).toEqual([]);
    expect(plan.unlinks).toEqual([]);
  });

  it('respects overrides and skips deselected ingredients on create', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            name: 'Jasmine Rice',
            quantity: 3,
            isQuantityOverridden: true,
            notes: 'rinsed',
            store: { id: 'store-tj', name: 'Trader Joes' },
          }),
          snapshotRow('source-salt', { isSelected: false }),
        ],
      }),
    });

    expect(plan.creates).toEqual([
      expect.objectContaining({
        source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
        fields: {
          name: 'Jasmine Rice',
          quantity: 3,
          unit: 'cup',
          category: 'Pantry',
          notes: 'rinsed',
          storeId: 'store-tj',
        },
      }),
    ]);
  });

  it('applies the default store to sources without a store', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry(),
      defaultStore: { id: 'store-default', name: 'Default' },
    });

    expect(plan.creates.map(create => create.fields.storeId)).toEqual([
      'store-costco',
      'store-default',
    ]);
  });

  it('does not update a default-store item that already matches', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-salt', {
            grocery_item: linkedItem({
              name: 'Salt',
              quantity: 2,
              unit: 'tsp',
              store: { id: 'store-default' },
            }),
          }),
        ],
        sourceIngredients: sourceIngredients.filter(
          source => source.id === 'source-salt'
        ),
      }),
      defaultStore: { id: 'store-default', name: 'Default' },
    });

    expect(plan).toEqual(emptyPlan);
  });

  it('updates non-overridden quantities on a servings change and leaves overridden ones', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        servings: 4,
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem({ id: 'grocery-rice', quantity: 1 }),
          }),
          snapshotRow('source-salt', {
            quantity: 5,
            isQuantityOverridden: true,
            grocery_item: linkedItem({
              id: 'grocery-salt',
              name: 'Salt',
              quantity: 5,
              unit: 'tsp',
              store: null,
            }),
          }),
        ],
      }),
    });

    expect(plan.updates).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
        groceryItemId: 'grocery-rice',
        previousStoreId: 'store-costco',
        fields: expect.objectContaining({ quantity: 2 }),
      },
    ]);
    expect(plan.creates).toEqual([]);
    expect(plan.deletes).toEqual([]);
  });

  it('updates the linked item when an override changes', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            category: 'Grains',
            store: { id: 'store-tj', name: 'Trader Joes' },
            grocery_item: linkedItem({ id: 'grocery-rice' }),
          }),
        ],
      }),
    });

    expect(plan.updates).toEqual([
      expect.objectContaining({
        groceryItemId: 'grocery-rice',
        previousStoreId: 'store-costco',
        fields: expect.objectContaining({
          category: 'Grains',
          storeId: 'store-tj',
        }),
      }),
    ]);
  });

  it('never updates checked or soft-deleted linked items', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        servings: 10,
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem({ id: 'grocery-rice', isChecked: true }),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem({ id: 'grocery-salt', isDeleted: true }),
          }),
        ],
      }),
    });

    expect(plan).toEqual(emptyPlan);
  });

  it('deletes the unchecked item of a deselected ingredient', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            isSelected: false,
            grocery_item: linkedItem({ id: 'grocery-rice' }),
          }),
        ],
      }),
    });

    expect(plan.deletes).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
        groceryItemId: 'grocery-rice',
      },
    ]);
  });

  it('leaves the checked item of a deselected ingredient alone', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        sourceIngredients: sourceIngredients.slice(0, 1),
        snapshotRows: [
          snapshotRow('source-rice', {
            isSelected: false,
            grocery_item: linkedItem({ isChecked: true }),
          }),
        ],
      }),
    });

    expect(plan).toEqual(emptyPlan);
  });

  it('re-creates a reselected ingredient only when nothing is linked', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem({ isDeleted: true }),
          }),
          snapshotRow('source-salt'),
        ],
      }),
    });

    expect(plan.creates.map(create => create.source)).toEqual([
      { type: 'snapshot', snapshotId: 'snapshot-source-salt' },
    ]);

    const checkedPlan = planMealPlanListSync({
      entry: recipeEntry({
        sourceIngredients: sourceIngredients.slice(0, 1),
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem({ isChecked: true }),
          }),
        ],
      }),
    });
    expect(checkedPlan).toEqual(emptyPlan);
  });

  it('deletes all unchecked items and creates nothing for an ignored entry', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem({ id: 'grocery-rice' }),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem({ id: 'grocery-salt', isChecked: true }),
          }),
        ],
      }),
    });

    expect(plan).toEqual({
      ...emptyPlan,
      deletes: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
          groceryItemId: 'grocery-rice',
        },
      ],
    });
  });

  it('restores the pre-ignore selection when ignore is turned off', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        ignoredByGroceryList: false,
        snapshotRows: [
          snapshotRow('source-rice'),
          snapshotRow('source-salt', { isSelected: false }),
        ],
      }),
    });

    expect(plan.creates.map(create => create.source)).toEqual([
      { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
    ]);
  });

  it('deletes unchecked items and unlinks checked ones for a removed entry', () => {
    const plan = planMealPlanListSync({
      isRemoved: true,
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem({ id: 'grocery-rice' }),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem({ id: 'grocery-salt', isChecked: true }),
          }),
        ],
      }),
    });

    expect(plan).toEqual({
      ...emptyPlan,
      deletes: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
          groceryItemId: 'grocery-rice',
        },
      ],
      unlinks: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-source-salt' },
          groceryItemId: 'grocery-salt',
        },
      ],
    });
  });

  it('treats a snapshot whose recipe ingredient was deleted as removed', () => {
    const plan = planMealPlanListSync({
      entry: recipeEntry({
        sourceIngredients: sourceIngredients.slice(1),
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem({ id: 'grocery-rice', isChecked: true }),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem({
              id: 'grocery-salt',
              name: 'Salt',
              quantity: 2,
              unit: 'tsp',
              store: null,
            }),
          }),
        ],
      }),
    });

    expect(plan).toEqual({
      ...emptyPlan,
      unlinks: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
          groceryItemId: 'grocery-rice',
        },
      ],
    });
  });
});

describe('planMealPlanListSync — standalone items', () => {
  const itemSource = { type: 'item', mealPlanItemId: 'meal-plan-item-1' };

  it('creates a linked item without a recipe', () => {
    const plan = planMealPlanListSync({
      entry: itemEntry(),
      defaultStore: { id: 'store-default', name: 'Default' },
    });

    expect(plan).toEqual({
      ...emptyPlan,
      creates: [
        {
          source: itemSource,
          recipeId: undefined,
          fields: {
            name: 'Bananas',
            quantity: 6,
            unit: 'each',
            category: 'Produce',
            notes: null,
            storeId: 'store-default',
          },
        },
      ],
    });
  });

  it('updates the linked item when the meal plan item changes', () => {
    const plan = planMealPlanListSync({
      entry: itemEntry({ quantity: 12 }),
      defaultStore: null,
    });
    expect(plan.creates).toHaveLength(1);

    const updatePlan = planMealPlanListSync({
      entry: itemEntry({
        quantity: 12,
        grocery_item: linkedItem({
          id: 'grocery-bananas',
          name: 'Bananas',
          quantity: 6,
          unit: 'each',
          category: 'Produce',
          store: null,
        }),
      }),
    });
    expect(updatePlan).toEqual({
      ...emptyPlan,
      updates: [
        {
          source: itemSource,
          groceryItemId: 'grocery-bananas',
          previousStoreId: null,
          fields: expect.objectContaining({ quantity: 12 }),
        },
      ],
    });
  });

  it('deletes the unchecked item of an ignored item', () => {
    const plan = planMealPlanListSync({
      entry: itemEntry({
        ignoredByGroceryList: true,
        grocery_item: linkedItem({ id: 'grocery-bananas' }),
      }),
    });

    expect(plan).toEqual({
      ...emptyPlan,
      deletes: [{ source: itemSource, groceryItemId: 'grocery-bananas' }],
    });
  });

  it('keeps a checked item of an ignored item and unlinks it on removal', () => {
    const entry = itemEntry({
      ignoredByGroceryList: true,
      grocery_item: linkedItem({ id: 'grocery-bananas', isChecked: true }),
    });

    expect(planMealPlanListSync({ entry })).toEqual(emptyPlan);
    expect(planMealPlanListSync({ entry, isRemoved: true })).toEqual({
      ...emptyPlan,
      unlinks: [{ source: itemSource, groceryItemId: 'grocery-bananas' }],
    });
  });
});

describe('buildMealPlanListSyncTransactions', () => {
  const build = (plan: ReturnType<typeof planMealPlanListSync>) =>
    buildMealPlanListSyncTransactions({
      listId: 'list-1',
      plan,
      now: '2026-01-01T00:00:00.000Z',
    }) as unknown as Transaction[];

  it('creates standalone linked items without add events or stacking', () => {
    const transactions = build(planMealPlanListSync({ entry: recipeEntry() }));

    expect(
      transactions.some(
        transaction => transaction.namespace === 'grocery_item_add_events'
      )
    ).toBe(false);
    expect(
      transactions.every(
        transaction => transaction.namespace === 'grocery_items'
      )
    ).toBe(true);

    const updates = transactions.filter(
      transaction => transaction.operation === 'update'
    );
    expect(updates).toHaveLength(2);
    expect(new Set(updates.map(update => update.entityId)).size).toBe(2);
    expect(updates[0].payload).toEqual({
      name: 'Rice',
      quantity: 1,
      unit: 'cup',
      category: 'Pantry',
      notes: null,
      isChecked: false,
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const riceLinks = transactions
      .filter(
        transaction =>
          transaction.operation === 'link' &&
          transaction.entityId === updates[0].entityId
      )
      .map(transaction => transaction.payload);
    expect(riceLinks).toEqual([
      { grocery_list: 'list-1' },
      { meal_plan_ingredient_snapshot: 'snapshot-source-rice' },
      { store: 'store-costco' },
      { recipe: 'recipe-1' },
    ]);
  });

  it('links standalone items to their meal plan item', () => {
    const transactions = build(planMealPlanListSync({ entry: itemEntry() }));

    expect(
      transactions
        .filter(transaction => transaction.operation === 'link')
        .map(transaction => transaction.payload)
    ).toEqual([
      { grocery_list: 'list-1' },
      { meal_plan_item: 'meal-plan-item-1' },
    ]);
  });

  it('writes updates, store changes, hard deletes and unlinks', () => {
    const transactions = build({
      creates: [],
      updates: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-1' },
          groceryItemId: 'grocery-1',
          previousStoreId: 'store-old',
          fields: {
            name: 'Rice',
            quantity: 4,
            unit: 'cup',
            notes: null,
            category: null,
            storeId: 'store-new',
          },
        },
      ],
      deletes: [
        {
          source: { type: 'item', mealPlanItemId: 'item-1' },
          groceryItemId: 'grocery-2',
        },
      ],
      unlinks: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-3' },
          groceryItemId: 'grocery-3',
        },
      ],
    });

    expect(transactions).toEqual([
      {
        operation: 'update',
        namespace: 'grocery_items',
        entityId: 'grocery-1',
        payload: {
          name: 'Rice',
          quantity: 4,
          unit: 'cup',
          notes: null,
          category: null,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      {
        operation: 'unlink',
        namespace: 'grocery_items',
        entityId: 'grocery-1',
        payload: { store: 'store-old' },
      },
      {
        operation: 'link',
        namespace: 'grocery_items',
        entityId: 'grocery-1',
        payload: { store: 'store-new' },
      },
      {
        operation: 'delete',
        namespace: 'grocery_items',
        entityId: 'grocery-2',
        payload: undefined,
      },
      {
        operation: 'unlink',
        namespace: 'grocery_items',
        entityId: 'grocery-3',
        payload: { meal_plan_ingredient_snapshot: 'snapshot-3' },
      },
    ]);
  });
});
