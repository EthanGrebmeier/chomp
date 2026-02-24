import { describe, expect, it } from 'vitest';

import {
  buildIngredientMatchKey,
  planIngredientStacking,
} from '../stack-recipe-ingredients-plan';

describe('stack-recipe-ingredients planning', () => {
  it('normalizes name, unit, and category in match keys', () => {
    const keyA = buildIngredientMatchKey({
      name: '  Green   Onion ',
      unit: ' CUP ',
      category: ' Produce ',
      storeId: 'store-1',
    });
    const keyB = buildIngredientMatchKey({
      name: 'green onion',
      unit: 'cup',
      category: 'produce',
      storeId: 'store-1',
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
          category: 'Produce',
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
          category: 'Meat',
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
          storeId: 'store-1',
        },
      ],
    });

    expect(plan.quantityUpdates.size).toBe(0);
    expect(plan.createEntries).toHaveLength(0);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0]?.ingredientName).toBe('chicken breast');
  });
});
