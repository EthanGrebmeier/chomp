import { describe, expect, it, vi } from 'vitest';

import { isMealPlanOnly } from '../meal-plan-entry';
import { planMealPlanEntryIgnored } from '../plan-meal-plan-entry-ignored';
import type {
  LinkedGroceryItemForSync,
  MealPlanItemEntryForSync,
  MealPlanRecipeEntryForSync,
  MealPlanSnapshotRowForSync,
} from '../plan-meal-plan-list-sync';

vi.mock('../../../../lib/instant', () => ({ db: {} }));
vi.mock('@instantdb/react-native', () => ({ id: () => 'id', tx: {} }));

const sourceIngredients: MealPlanRecipeEntryForSync['sourceIngredients'] = [
  {
    id: 'source-rice',
    name: 'Rice',
    quantity: 0.5,
    unit: 'cup',
    category: 'Pantry',
    notes: null,
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
    store: null,
    isSelected: true,
    isQuantityOverridden: false,
    grocery_item: null,
    ...overrides,
  };
};

const linkedItem = (
  id: string,
  overrides: Partial<LinkedGroceryItemForSync> = {}
): LinkedGroceryItemForSync => ({
  id,
  name: 'Rice',
  quantity: 1,
  unit: 'cup',
  category: 'Pantry',
  notes: null,
  isChecked: false,
  isDeleted: false,
  store: null,
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
  grocery_item: null,
  ...overrides,
});

const createIdSequence = () => {
  let next = 0;
  return () => `new-snapshot-${++next}`;
};

const createdSnapshotIds = (
  plan: ReturnType<typeof planMealPlanEntryIgnored>
) =>
  plan.listSync.creates.map(create =>
    create.source.type === 'snapshot' ? create.source.snapshotId : null
  );

describe('planMealPlanEntryIgnored — ignoring', () => {
  it('removes unchecked linked items and leaves checked ones alone', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem('grocery-rice'),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem('grocery-salt', { isChecked: true }),
          }),
        ],
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.listSync).toEqual({
      creates: [],
      updates: [],
      deletes: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
          groceryItemId: 'grocery-rice',
        },
      ],
      unlinks: [],
    });
  });

  it('leaves the snapshot selection as it is', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', { isSelected: false }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem('grocery-salt'),
          }),
        ],
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowIdsToSelect).toEqual([]);
    expect(plan.snapshotRowsToCreate).toEqual([]);
  });
});

describe('planMealPlanEntryIgnored — un-ignoring', () => {
  it('restores exactly the selection from before', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice'),
          snapshotRow('source-salt', { isSelected: false }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowIdsToSelect).toEqual([]);
    expect(createdSnapshotIds(plan)).toEqual(['snapshot-source-rice']);
    expect(plan.listSync.deletes).toEqual([]);
  });

  it('selects every ingredient when nothing was selected', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice', { isSelected: false }),
          snapshotRow('source-salt', { isSelected: false }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowIdsToSelect).toEqual([
      'snapshot-source-rice',
      'snapshot-source-salt',
    ]);
    expect(createdSnapshotIds(plan)).toEqual([
      'snapshot-source-rice',
      'snapshot-source-salt',
    ]);
  });

  it('does not re-create items that are checked or soft-deleted', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem('grocery-rice', { isChecked: true }),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem('grocery-salt', { isDeleted: true }),
          }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.listSync.creates).toEqual([]);
  });

  it('backfills missing snapshot rows, selected, and lists them', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowsToCreate).toEqual([
      expect.objectContaining({
        id: 'new-snapshot-1',
        sourceRecipeIngredientId: 'source-rice',
        isSelected: true,
      }),
      expect.objectContaining({
        id: 'new-snapshot-2',
        sourceRecipeIngredientId: 'source-salt',
        isSelected: true,
      }),
    ]);
    expect(createdSnapshotIds(plan)).toEqual([
      'new-snapshot-1',
      'new-snapshot-2',
    ]);
  });

  it('applies the list default store to re-created items', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({ ignoredByGroceryList: true }),
      ignored: false,
      defaultStore: { id: 'store-default', name: 'Default' },
      createId: createIdSequence(),
    });

    expect(plan.listSync.creates).toEqual([
      expect.objectContaining({
        fields: expect.objectContaining({ storeId: 'store-default' }),
      }),
    ]);
  });
});

describe('planMealPlanEntryIgnored — recipes and items share a contract', () => {
  it('ignoring an item removes its unchecked linked item', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({ grocery_item: linkedItem('grocery-bananas') }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.listSync.deletes).toEqual([
      {
        source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
        groceryItemId: 'grocery-bananas',
      },
    ]);
  });

  it('ignoring an item leaves its checked linked item alone', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({
        grocery_item: linkedItem('grocery-bananas', { isChecked: true }),
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.listSync).toEqual({
      creates: [],
      updates: [],
      deletes: [],
      unlinks: [],
    });
  });

  it('un-ignoring an item puts it back on the list', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({ ignoredByGroceryList: true }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowIdsToSelect).toEqual([]);
    expect(plan.snapshotRowsToCreate).toEqual([]);
    expect(plan.listSync.creates).toEqual([
      {
        source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
        fields: {
          name: 'Bananas',
          quantity: 6,
          unit: 'each',
          category: 'Produce',
          notes: null,
          storeId: null,
        },
      },
    ]);
  });
});

describe('isMealPlanOnly', () => {
  it('is true only for ignored entries', () => {
    expect(isMealPlanOnly({ ignoredByGroceryList: true })).toBe(true);
    expect(isMealPlanOnly({ ignoredByGroceryList: false })).toBe(false);
    expect(isMealPlanOnly({ ignoredByGroceryList: null })).toBe(false);
    expect(isMealPlanOnly({})).toBe(false);
  });
});
