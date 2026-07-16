import { describe, expect, it } from 'vitest';

import {
  applyDefaultStoreToStackableIngredients,
  buildIngredientMatchKey,
  planIngredientStacking,
} from '../stack-recipe-ingredients-plan';

describe('stack-recipe-ingredients planning', () => {
  it('normalizes name, unit, and category in match keys', () => {
    const keyA = buildIngredientMatchKey({
      name: '  Green   Onion ',
      unit: ' CUP ',
      category: ' Produce ',
      storeName: ' Trader   Joes ',
    });
    const keyB = buildIngredientMatchKey({
      name: 'green onion',
      unit: 'cup',
      category: 'produce',
      storeName: 'trader joes',
    });

    expect(keyA).toBe(keyB);
  });

  it('stacks duplicate incoming ingredients in a single action', () => {
    const plan = planIngredientStacking({
      existingItems: [],
      conflictResolution: 'separate',
      ingredients: [
        {
          name: 'Milk',
          quantity: 1,
          unit: 'cup',
          category: 'Dairy',
          recipeId: 'recipe-1',
        },
        {
          name: ' milk ',
          quantity: 2,
          unit: ' CUP ',
          category: 'dairy',
          recipeId: 'recipe-1',
        },
      ],
    });

    expect(plan.conflicts).toHaveLength(0);
    expect(plan.createEntries).toHaveLength(1);
    expect(plan.createEntries[0]?.quantity).toBe(3);
  });

  it('stacks onto existing item when metadata key matches', () => {
    const plan = planIngredientStacking({
      existingItems: [
        {
          id: 'existing-1',
          name: 'Tomato',
          quantity: 2,
          unit: 'each',
          isChecked: false,
          category: 'Produce',
          storeName: 'Whole Foods',
          storeId: 'store-1',
        },
      ],
      conflictResolution: 'prompt',
      ingredients: [
        {
          name: ' tomato ',
          quantity: 4,
          unit: 'EACH',
          category: 'produce',
          storeName: 'whole foods',
          storeId: 'store-1',
        },
      ],
    });

    expect(plan.conflicts).toHaveLength(0);
    expect(plan.createEntries).toHaveLength(0);
    expect(plan.quantityUpdates.get('existing-1')).toBe(4);
  });

  it('returns a conflict when only the ingredient name matches', () => {
    const plan = planIngredientStacking({
      existingItems: [
        {
          id: 'existing-1',
          name: 'Chicken Breast',
          quantity: 1,
          unit: 'lb',
          isChecked: false,
          category: 'Meat',
          storeName: 'Costco',
          storeId: 'store-1',
        },
      ],
      conflictResolution: 'prompt',
      ingredients: [
        {
          name: 'chicken breast',
          quantity: 2,
          unit: 'lb',
          category: 'Freezer',
          storeName: 'costco',
          storeId: 'store-1',
        },
      ],
    });

    expect(plan.quantityUpdates.size).toBe(0);
    expect(plan.createEntries).toHaveLength(0);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0]?.ingredientName).toBe('chicken breast');
  });

  it('stacks when normalized store names match despite different store IDs', () => {
    const plan = planIngredientStacking({
      existingItems: [
        {
          id: 'existing-1',
          name: 'Banana',
          quantity: 3,
          unit: 'each',
          isChecked: false,
          category: 'Produce',
          storeName: 'Trader Joes',
          storeId: 'store-a',
        },
      ],
      conflictResolution: 'prompt',
      ingredients: [
        {
          name: 'banana',
          quantity: 2,
          unit: 'each',
          category: 'produce',
          storeName: ' trader   joes ',
          storeId: 'store-b',
        },
      ],
    });

    expect(plan.conflicts).toHaveLength(0);
    expect(plan.createEntries).toHaveLength(0);
    expect(plan.quantityUpdates.get('existing-1')).toBe(2);
  });

  it('does not stack when store names differ', () => {
    const plan = planIngredientStacking({
      existingItems: [
        {
          id: 'existing-1',
          name: 'Banana',
          quantity: 3,
          unit: 'each',
          isChecked: false,
          category: 'Produce',
          storeName: 'Trader Joes',
          storeId: 'store-a',
        },
      ],
      conflictResolution: 'prompt',
      ingredients: [
        {
          name: 'banana',
          quantity: 2,
          unit: 'each',
          category: 'produce',
          storeName: 'Safeway',
          storeId: 'store-b',
        },
      ],
    });

    expect(plan.quantityUpdates.size).toBe(0);
    expect(plan.createEntries).toHaveLength(0);
    expect(plan.conflicts).toHaveLength(1);
  });

  it('creates a new item instead of stacking onto a checked exact match', () => {
    const plan = planIngredientStacking({
      existingItems: [
        {
          id: 'checked-item',
          name: 'Milk',
          quantity: 1,
          unit: 'gallon',
          isChecked: true,
          category: 'Dairy',
        },
      ],
      conflictResolution: 'prompt',
      ingredients: [
        {
          name: 'milk',
          quantity: 2,
          unit: 'gallon',
          category: 'dairy',
        },
      ],
    });

    expect(plan.quantityUpdates.size).toBe(0);
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.createEntries).toHaveLength(1);
    expect(plan.createEntries[0]?.quantity).toBe(2);
  });

  it('does not treat a checked name-only match as a conflict', () => {
    const plan = planIngredientStacking({
      existingItems: [
        {
          id: 'checked-item',
          name: 'Chicken Breast',
          quantity: 1,
          unit: 'lb',
          isChecked: true,
          category: 'Meat',
        },
      ],
      conflictResolution: 'prompt',
      ingredients: [
        {
          name: 'chicken breast',
          quantity: 2,
          unit: 'each',
          category: 'Freezer',
        },
      ],
    });

    expect(plan.quantityUpdates.size).toBe(0);
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.createEntries).toHaveLength(1);
  });

  it('stacks onto an unchecked match when a newer checked match also exists', () => {
    const plan = planIngredientStacking({
      existingItems: [
        {
          id: 'checked-item',
          name: 'Tomato',
          quantity: 4,
          unit: 'each',
          isChecked: true,
          category: 'Produce',
          updatedAt: '2026-07-15T12:00:00.000Z',
        },
        {
          id: 'unchecked-item',
          name: 'Tomato',
          quantity: 2,
          unit: 'each',
          isChecked: false,
          category: 'Produce',
          updatedAt: '2026-07-14T12:00:00.000Z',
        },
      ],
      conflictResolution: 'prompt',
      ingredients: [
        {
          name: 'tomato',
          quantity: 3,
          unit: 'each',
          category: 'produce',
        },
      ],
    });

    expect(plan.quantityUpdates).toEqual(new Map([['unchecked-item', 3]]));
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.createEntries).toHaveLength(0);
  });

  it('applies the default store to ingredients without stores', () => {
    const ingredients = applyDefaultStoreToStackableIngredients(
      [
        {
          name: 'Milk',
          quantity: 1,
          unit: 'gallon',
          category: 'Dairy',
        },
      ],
      { id: 'default-store', name: 'Target' }
    );

    expect(ingredients[0]?.storeId).toBe('default-store');
    expect(ingredients[0]?.storeName).toBe('Target');
  });

  it('keeps explicit ingredient stores when a default store exists', () => {
    const ingredients = applyDefaultStoreToStackableIngredients(
      [
        {
          name: 'Eggs',
          quantity: 1,
          unit: 'dozen',
          category: 'Dairy',
          storeId: 'explicit-store',
          storeName: 'Costco',
        },
      ],
      { id: 'default-store', name: 'Target' }
    );

    expect(ingredients[0]?.storeId).toBe('explicit-store');
    expect(ingredients[0]?.storeName).toBe('Costco');
  });
});
