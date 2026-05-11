import { describe, expect, it } from 'vitest';

import { projectMealPlanRecipeToListInputs } from '../meal-plan-to-list-projection';

describe('meal-plan-to-list projection', () => {
  const recipeId = 'recipe-1';

  it('excludes unselected snapshot rows from output', () => {
    const result = projectMealPlanRecipeToListInputs({
      recipeId,
      servings: 2,
      sourceIngredients: [
        {
          id: 'source-1',
          name: 'Olive Oil',
          quantity: 1,
          unit: 'tbsp',
          category: 'Pantry',
          notes: null,
          store: { id: 'store-1', name: 'Costco' },
        },
      ],
      snapshotRows: [
        {
          sourceRecipeIngredientId: 'source-1',
          name: 'Olive Oil',
          quantity: 1,
          unit: 'tbsp',
          category: 'Pantry',
          notes: null,
          isSelected: false,
          isQuantityOverridden: false,
          store: { id: 'store-1', name: 'Costco' },
        },
      ],
    });

    expect(result).toHaveLength(0);
  });

  it('prefers snapshot override values over source ingredient values', () => {
    const result = projectMealPlanRecipeToListInputs({
      recipeId,
      servings: 2,
      sourceIngredients: [
        {
          id: 'source-1',
          name: 'Scallions',
          quantity: 1,
          unit: 'bunch',
          category: 'Produce',
          notes: 'green parts',
          store: { id: 'store-source', name: 'Safeway' },
        },
      ],
      snapshotRows: [
        {
          sourceRecipeIngredientId: 'source-1',
          name: 'Green Onion',
          quantity: 3,
          unit: 'stalk',
          category: 'Fresh',
          notes: 'thinly sliced',
          isSelected: true,
          isQuantityOverridden: true,
          store: { id: 'store-override', name: 'Trader Joes' },
        },
      ],
    });

    expect(result).toEqual([
      {
        name: 'Green Onion',
        quantity: 3,
        unit: 'stalk',
        category: 'Fresh',
        notes: 'thinly sliced',
        storeName: 'Trader Joes',
        storeId: 'store-override',
        recipeId,
      },
    ]);
  });

  it('keeps overridden quantities absolute while scaling non-overridden rows', () => {
    const result = projectMealPlanRecipeToListInputs({
      recipeId,
      servings: 3,
      sourceIngredients: [
        {
          id: 'source-1',
          name: 'Rice',
          quantity: 0.5,
          unit: 'cup',
          category: 'Pantry',
          notes: null,
        },
        {
          id: 'source-2',
          name: 'Salt',
          quantity: 0.25,
          unit: 'tsp',
          category: 'Pantry',
          notes: null,
        },
      ],
      snapshotRows: [
        {
          sourceRecipeIngredientId: 'source-1',
          name: 'Rice',
          quantity: 2,
          unit: 'cup',
          category: 'Pantry',
          notes: null,
          isSelected: true,
          isQuantityOverridden: true,
        },
        {
          sourceRecipeIngredientId: 'source-2',
          name: 'Salt',
          quantity: 99,
          unit: 'tsp',
          category: 'Pantry',
          notes: null,
          isSelected: true,
          isQuantityOverridden: false,
        },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.quantity).toBe(2);
    expect(result[1]?.quantity).toBe(0.75);
  });

  it('applies source-id reconciliation outcomes deterministically', () => {
    const result = projectMealPlanRecipeToListInputs({
      recipeId,
      servings: 2,
      sourceIngredients: [
        {
          id: 'source-existing',
          name: 'Tomato',
          quantity: 2,
          unit: 'each',
          category: 'Produce',
          notes: null,
        },
        {
          id: 'source-new',
          name: 'Basil',
          quantity: 4,
          unit: 'leaf',
          category: 'Produce',
          notes: null,
        },
      ],
      snapshotRows: [
        {
          sourceRecipeIngredientId: 'source-existing',
          name: 'Roma Tomato',
          quantity: 2,
          unit: 'each',
          category: 'Produce',
          notes: null,
          isSelected: true,
          isQuantityOverridden: false,
        },
        {
          sourceRecipeIngredientId: 'source-deleted',
          name: 'Deleted Ingredient',
          quantity: 10,
          unit: 'g',
          category: 'Other',
          notes: null,
          isSelected: true,
          isQuantityOverridden: true,
        },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result.map(row => row.name)).toEqual(['Roma Tomato', 'Basil']);
    expect(result.map(row => row.quantity)).toEqual([4, 8]);
  });

  it('returns payload fields required by stacking input contract', () => {
    const result = projectMealPlanRecipeToListInputs({
      recipeId,
      servings: 1,
      sourceIngredients: [
        {
          id: 'source-1',
          name: 'Greek Yogurt',
          quantity: 1,
          unit: 'cup',
          category: 'Dairy',
          notes: 'plain',
          store: { id: 'store-1', name: 'Whole Foods' },
        },
      ],
      snapshotRows: [],
    });

    expect(result).toEqual([
      {
        name: 'Greek Yogurt',
        quantity: 1,
        unit: 'cup',
        category: 'Dairy',
        notes: 'plain',
        storeName: 'Whole Foods',
        storeId: 'store-1',
        recipeId,
      },
    ]);
  });
});
