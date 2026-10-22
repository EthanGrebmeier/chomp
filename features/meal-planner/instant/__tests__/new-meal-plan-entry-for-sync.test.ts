import { describe, expect, it } from 'vitest';

import {
  toNewMealPlanItemEntryForSync,
  toNewMealPlanRecipeEntryForSync,
} from '../new-meal-plan-entry-for-sync';
import { planMealPlanListSync } from '../plan-meal-plan-list-sync';

const sourceIngredients = [
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
  {
    id: 'source-lime',
    name: 'Lime',
    quantity: 1,
    unit: 'each',
    category: 'Produce',
    notes: null,
  },
];

const snapshotInput = (
  source: (typeof sourceIngredients)[number],
  overrides: Partial<{
    name: string;
    quantity: number;
    isSelected: boolean;
    isQuantityOverridden: boolean;
    storeId: string;
  }> = {}
) => ({
  id: `snapshot-${source.id}`,
  sourceRecipeIngredientId: source.id,
  name: source.name,
  quantity: source.quantity,
  unit: source.unit,
  notes: source.notes,
  category: source.category,
  isSelected: true,
  isQuantityOverridden: false,
  storeId: source.store?.id,
  ...overrides,
});

describe('toNewMealPlanRecipeEntryForSync', () => {
  it('creates a linked item for each selected ingredient of a new recipe entry', () => {
    const [rice, salt, lime] = sourceIngredients;
    const entry = toNewMealPlanRecipeEntryForSync({
      mealPlanRecipeId: 'meal-plan-recipe-1',
      recipeId: 'recipe-1',
      servings: 2,
      sourceIngredients,
      snapshotRows: [
        snapshotInput(rice),
        snapshotInput(salt, {
          name: 'Sea salt',
          quantity: 3,
          isQuantityOverridden: true,
          storeId: 'store-market',
        }),
        snapshotInput(lime, { isSelected: false }),
      ],
    });

    const plan = planMealPlanListSync({ entry });

    expect(plan).toEqual({
      creates: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
          recipeId: 'recipe-1',
          fields: {
            name: 'Rice',
            quantity: 1,
            unit: 'cup',
            notes: null,
            category: 'Pantry',
            storeId: 'store-costco',
          },
        },
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-source-salt' },
          recipeId: 'recipe-1',
          fields: {
            name: 'Sea salt',
            quantity: 3,
            unit: 'tsp',
            notes: null,
            category: 'Pantry',
            storeId: 'store-market',
          },
        },
      ],
      updates: [],
      deletes: [],
      unlinks: [],
    });
  });

  it('applies the default store to ingredients without a store', () => {
    const [rice, salt] = sourceIngredients;
    const plan = planMealPlanListSync({
      entry: toNewMealPlanRecipeEntryForSync({
        mealPlanRecipeId: 'meal-plan-recipe-1',
        recipeId: 'recipe-1',
        servings: 1,
        sourceIngredients: [rice, salt],
        snapshotRows: [snapshotInput(rice), snapshotInput(salt)],
      }),
      defaultStore: { id: 'store-default', name: 'Default' },
    });

    expect(plan.creates.map(create => create.fields.storeId)).toEqual([
      'store-costco',
      'store-default',
    ]);
  });
});

describe('toNewMealPlanItemEntryForSync', () => {
  it('creates the linked item for a new standalone entry', () => {
    const plan = planMealPlanListSync({
      entry: toNewMealPlanItemEntryForSync({
        mealPlanItemId: 'meal-plan-item-1',
        name: ' Bananas ',
        quantity: 6,
        unit: 'each',
        category: 'Produce',
        storeId: 'store-market',
      }),
    });

    expect(plan).toEqual({
      creates: [
        {
          source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
          fields: {
            name: 'Bananas',
            quantity: 6,
            unit: 'each',
            notes: null,
            category: 'Produce',
            storeId: 'store-market',
          },
        },
      ],
      updates: [],
      deletes: [],
      unlinks: [],
    });
  });

  it('applies the default store when the item has none', () => {
    const plan = planMealPlanListSync({
      entry: toNewMealPlanItemEntryForSync({
        mealPlanItemId: 'meal-plan-item-1',
        name: 'Bananas',
        quantity: 6,
        unit: 'each',
      }),
      defaultStore: { id: 'store-default', name: 'Default' },
    });

    expect(plan.creates[0]?.fields.storeId).toBe('store-default');
  });
});
