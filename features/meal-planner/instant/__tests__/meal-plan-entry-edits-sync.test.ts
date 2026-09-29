import { describe, expect, it } from 'vitest';

import {
  applyMealPlanItemEdit,
  applySnapshotRowEdits,
  resolveStoreEdit,
} from '../apply-meal-plan-entry-edits';
import {
  type MealPlanItemSyncRow,
  type MealPlanRecipeSyncRow,
  toMealPlanItemSyncContext,
  toMealPlanRecipeSyncContext,
} from '../meal-plan-entry-sync-context';
import {
  type LinkedGroceryItemForSync,
  planMealPlanListSync,
} from '../plan-meal-plan-list-sync';

const rice = {
  id: 'source-rice',
  name: 'Rice',
  quantity: 0.5,
  unit: 'cup',
  category: 'Pantry',
  notes: null,
  store: { id: 'store-costco', name: 'Costco' },
};
const lime = {
  id: 'source-lime',
  name: 'Lime',
  quantity: 1,
  unit: 'each',
  category: 'Produce',
  notes: null,
};

const linkedItem = (
  overrides: Partial<LinkedGroceryItemForSync> & { id: string }
): LinkedGroceryItemForSync => ({
  name: 'Rice',
  quantity: 0.5,
  unit: 'cup',
  notes: null,
  category: 'Pantry',
  isChecked: false,
  isDeleted: false,
  store: { id: 'store-costco' },
  ...overrides,
});

const recipeRow = (
  overrides: Partial<MealPlanRecipeSyncRow> = {}
): MealPlanRecipeSyncRow => ({
  id: 'meal-plan-recipe-1',
  servings: 1,
  ignoredByGroceryList: false,
  grocery_list: { id: 'list-1' },
  recipe: { id: 'recipe-1', recipe_ingredients: [rice, lime] },
  ingredient_snapshots: [
    {
      id: 'snapshot-rice',
      sourceRecipeIngredientId: rice.id,
      name: rice.name,
      quantity: rice.quantity,
      unit: rice.unit,
      notes: null,
      category: rice.category,
      isSelected: true,
      isQuantityOverridden: false,
      store: { id: 'store-costco' },
      grocery_item: linkedItem({ id: 'item-rice' }),
    },
    {
      id: 'snapshot-lime',
      sourceRecipeIngredientId: lime.id,
      name: lime.name,
      quantity: lime.quantity,
      unit: lime.unit,
      notes: null,
      category: lime.category,
      isSelected: true,
      isQuantityOverridden: false,
      grocery_item: linkedItem({
        id: 'item-lime',
        name: 'Lime',
        quantity: 1,
        unit: 'each',
        category: 'Produce',
        store: null,
      }),
    },
  ],
  ...overrides,
});

const recipeContext = (overrides: Partial<MealPlanRecipeSyncRow> = {}) => {
  const context = toMealPlanRecipeSyncContext(recipeRow(overrides));
  if (!context) throw new Error('expected a sync context');
  return context;
};

const emptyPlan = { creates: [], updates: [], deletes: [], unlinks: [] };

describe('toMealPlanRecipeSyncContext', () => {
  it('maps a loaded meal plan recipe to its list and sync entry', () => {
    const context = recipeContext();

    expect(context.listId).toBe('list-1');
    expect(context.entry).toMatchObject({
      kind: 'recipe',
      id: 'meal-plan-recipe-1',
      recipeId: 'recipe-1',
      sourceIngredients: [rice, lime],
    });
    expect(planMealPlanListSync({ entry: context.entry })).toEqual(emptyPlan);
  });

  it('returns null without a list or a recipe', () => {
    expect(toMealPlanRecipeSyncContext(recipeRow({ grocery_list: null }))).toBe(
      null
    );
    expect(toMealPlanRecipeSyncContext(recipeRow({ recipe: null }))).toBe(null);
  });
});

describe('meal plan recipe edits → linked grocery items', () => {
  it('updates quantities that are not overridden when servings change', () => {
    const { ingredient_snapshots = [] } = recipeRow();
    const [riceSnapshot, limeSnapshot] = ingredient_snapshots;
    const { entry } = recipeContext({
      ingredient_snapshots: [
        riceSnapshot,
        { ...limeSnapshot, quantity: 4, isQuantityOverridden: true },
      ],
    });
    const plan = planMealPlanListSync({ entry: { ...entry, servings: 3 } });

    expect(plan.updates).toEqual([
      expect.objectContaining({
        groceryItemId: 'item-rice',
        fields: expect.objectContaining({ quantity: 1.5 }),
      }),
      expect.objectContaining({
        groceryItemId: 'item-lime',
        fields: expect.objectContaining({ quantity: 4 }),
      }),
    ]);
  });

  it('leaves linked items alone for a date or meal tag change', () => {
    const { entry } = recipeContext();

    expect(planMealPlanListSync({ entry })).toEqual(emptyPlan);
  });

  it('removes the unchecked row when an ingredient is deselected', () => {
    const { entry } = recipeContext();
    const plan = planMealPlanListSync({
      entry: applySnapshotRowEdits(
        entry,
        new Map([['snapshot-lime', { isSelected: false }]])
      ),
    });

    expect(plan).toEqual({
      ...emptyPlan,
      deletes: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-lime' },
          groceryItemId: 'item-lime',
        },
      ],
    });
  });

  it('adds the row back when an ingredient is reselected', () => {
    const { ingredient_snapshots = [] } = recipeRow();
    const [riceSnapshot, limeSnapshot] = ingredient_snapshots;
    const { entry } = recipeContext({
      ingredient_snapshots: [
        riceSnapshot,
        { ...limeSnapshot, isSelected: false, grocery_item: null },
      ],
    });
    const plan = planMealPlanListSync({
      entry: applySnapshotRowEdits(
        entry,
        new Map([['snapshot-lime', { isSelected: true }]])
      ),
    });

    expect(plan).toEqual({
      ...emptyPlan,
      creates: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-lime' },
          recipeId: 'recipe-1',
          fields: {
            name: 'Lime',
            quantity: 1,
            unit: 'each',
            notes: null,
            category: 'Produce',
            storeId: null,
          },
        },
      ],
    });
  });

  it('applies select-none to every row at once', () => {
    const { entry } = recipeContext();
    const plan = planMealPlanListSync({
      entry: applySnapshotRowEdits(
        entry,
        new Map([
          ['snapshot-rice', { isSelected: false }],
          ['snapshot-lime', { isSelected: false }],
        ])
      ),
    });

    expect(plan.deletes.map(change => change.groceryItemId)).toEqual([
      'item-rice',
      'item-lime',
    ]);
  });

  it('updates the row when an override is edited', () => {
    const { entry } = recipeContext();
    const plan = planMealPlanListSync({
      entry: applySnapshotRowEdits(
        entry,
        new Map([
          [
            'snapshot-rice',
            {
              name: 'Brown rice',
              quantity: 2,
              unit: 'lb',
              notes: 'long grain',
              category: 'Grains',
              isQuantityOverridden: true,
              storeId: 'store-market',
            },
          ],
        ])
      ),
    });

    expect(plan).toEqual({
      ...emptyPlan,
      updates: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-rice' },
          groceryItemId: 'item-rice',
          previousStoreId: 'store-costco',
          fields: {
            name: 'Brown rice',
            quantity: 2,
            unit: 'lb',
            notes: 'long grain',
            category: 'Grains',
            storeId: 'store-market',
          },
        },
      ],
    });
  });

  it('never changes checked rows', () => {
    const { ingredient_snapshots = [] } = recipeRow();
    const [riceSnapshot, limeSnapshot] = ingredient_snapshots;
    const { entry } = recipeContext({
      ingredient_snapshots: [
        {
          ...riceSnapshot,
          grocery_item: linkedItem({ id: 'item-rice', isChecked: true }),
        },
        limeSnapshot,
      ],
    });

    const edited = applySnapshotRowEdits(
      entry,
      new Map([['snapshot-rice', { name: 'Brown rice' }]])
    );
    expect(planMealPlanListSync({ entry: edited })).toEqual(emptyPlan);
    expect(
      planMealPlanListSync({ entry: { ...entry, servings: 4 } }).updates.map(
        update => update.groceryItemId
      )
    ).toEqual(['item-lime']);
    expect(
      planMealPlanListSync({
        entry: applySnapshotRowEdits(
          entry,
          new Map([['snapshot-rice', { isSelected: false }]])
        ),
      })
    ).toEqual(emptyPlan);
  });

  it('deletes unchecked and unlinks checked rows when the old recipe is swapped out', () => {
    const { ingredient_snapshots = [] } = recipeRow();
    const [riceSnapshot, limeSnapshot] = ingredient_snapshots;
    const { entry } = recipeContext({
      ingredient_snapshots: [
        {
          ...riceSnapshot,
          grocery_item: linkedItem({ id: 'item-rice', isChecked: true }),
        },
        limeSnapshot,
      ],
    });

    const plan = planMealPlanListSync({ entry, isRemoved: true });
    expect(plan.deletes.map(change => change.groceryItemId)).toEqual([
      'item-lime',
    ]);
    expect(plan.unlinks.map(change => change.groceryItemId)).toEqual([
      'item-rice',
    ]);
  });
});

const itemRow = (
  overrides: Partial<MealPlanItemSyncRow> = {}
): MealPlanItemSyncRow => ({
  id: 'meal-plan-item-1',
  ignoredByGroceryList: false,
  name: 'Bread',
  quantity: 1,
  unit: 'loaf',
  notes: null,
  category: 'Bakery',
  store: { id: 'store-costco' },
  grocery_list: { id: 'list-1' },
  grocery_item: linkedItem({
    id: 'item-bread',
    name: 'Bread',
    quantity: 1,
    unit: 'loaf',
    category: 'Bakery',
  }),
  ...overrides,
});

const itemContext = (overrides: Partial<MealPlanItemSyncRow> = {}) => {
  const context = toMealPlanItemSyncContext(itemRow(overrides));
  if (!context) throw new Error('expected a sync context');
  return context;
};

describe('meal plan item edits → linked grocery item', () => {
  it('returns null without a list', () => {
    expect(toMealPlanItemSyncContext(itemRow({ grocery_list: null }))).toBe(
      null
    );
  });

  it('updates the linked row for every field', () => {
    const { listId, entry } = itemContext();
    const plan = planMealPlanListSync({
      entry: applyMealPlanItemEdit(entry, {
        name: 'Sourdough',
        quantity: 2,
        unit: 'each',
        notes: 'sliced',
        category: null,
        storeId: '',
      }),
    });

    expect(listId).toBe('list-1');
    expect(plan).toEqual({
      ...emptyPlan,
      updates: [
        {
          source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
          groceryItemId: 'item-bread',
          previousStoreId: 'store-costco',
          fields: {
            name: 'Sourdough',
            quantity: 2,
            unit: 'each',
            notes: 'sliced',
            category: null,
            storeId: null,
          },
        },
      ],
    });
  });

  it('keeps fields that are not part of the edit', () => {
    const { entry } = itemContext();

    expect(
      planMealPlanListSync({
        entry: applyMealPlanItemEdit(entry, { name: undefined }),
      })
    ).toEqual(emptyPlan);
  });

  it('never changes a checked row', () => {
    const { entry } = itemContext({
      grocery_item: linkedItem({ id: 'item-bread', isChecked: true }),
    });

    expect(
      planMealPlanListSync({
        entry: applyMealPlanItemEdit(entry, { quantity: 5 }),
      })
    ).toEqual(emptyPlan);
  });
});

describe('resolveStoreEdit', () => {
  it('keeps, clears or replaces the store', () => {
    const store = { id: 'store-costco' };

    expect(resolveStoreEdit(store, undefined)).toBe(store);
    expect(resolveStoreEdit(store, '')).toBe(null);
    expect(resolveStoreEdit(store, 'store-market')).toEqual({
      id: 'store-market',
    });
  });
});
