import { describe, expect, it } from 'vitest';

import {
  MealPlanItemForAdd,
  MealPlanRecipeForAdd,
  planAddMealsToGroceryList,
} from '../plan-add-meals-to-grocery-list';

const referenceDate = new Date(2026, 0, 10);

const buildRecipe = (
  overrides: Partial<MealPlanRecipeForAdd> & { id: string }
): MealPlanRecipeForAdd => ({
  date: '2026-01-10',
  addedToList: false,
  servings: 1,
  recipe: {
    id: `recipe-${overrides.id}`,
    user: { id: 'user-1' },
    recipe_ingredients: [
      { id: `ing-${overrides.id}`, name: 'Rice', quantity: 1, unit: 'cup' },
    ],
  },
  ingredient_snapshots: [],
  ...overrides,
});

const buildItem = (
  overrides: Partial<MealPlanItemForAdd> & { id: string }
): MealPlanItemForAdd => ({
  date: '2026-01-10',
  addedToList: false,
  name: 'Bananas',
  quantity: 3,
  unit: '',
  store: { id: 'store-1', name: 'Costco' },
  ...overrides,
});

describe('planAddMealsToGroceryList', () => {
  it('adds all unadded, addable entries when no selection is given', () => {
    const plan = planAddMealsToGroceryList({
      recipes: [
        buildRecipe({ id: 'r1', servings: 2 }),
        buildRecipe({ id: 'added', addedToList: true }),
        buildRecipe({ id: 'stale', date: '2025-12-01' }),
      ],
      items: [buildItem({ id: 'i1' })],
      userId: 'user-1',
      referenceDate,
    });

    expect(plan.addedRecipeCount).toBe(1);
    expect(plan.addedItemCount).toBe(1);
    expect(plan.recipeIdsToMarkAdded).toEqual(['r1']);
    expect(plan.itemIdsToMarkAdded).toEqual(['i1']);
    expect(plan.ownedRecipeIdsAdded).toEqual(['recipe-r1']);
    expect(plan.ingredientsToAdd).toEqual([
      expect.objectContaining({
        name: 'Rice',
        quantity: 2,
        recipeId: 'recipe-r1',
      }),
      expect.objectContaining({
        name: 'Bananas',
        quantity: 3,
        storeId: 'store-1',
        storeName: 'Costco',
      }),
    ]);
    expect(plan.snapshotReconciliations).toHaveLength(1);
    expect(plan.snapshotReconciliations[0].mealPlanRecipeId).toBe('r1');
  });

  it('marks skipped entries as added without adding ingredients', () => {
    const plan = planAddMealsToGroceryList({
      recipes: [buildRecipe({ id: 'r1' }), buildRecipe({ id: 'r2' })],
      items: [buildItem({ id: 'i1' }), buildItem({ id: 'i2' })],
      selectedRecipeIds: ['r1'],
      skippedRecipeIds: ['r2'],
      selectedItemIds: [],
      skippedItemIds: ['i1', 'i2'],
      userId: 'user-1',
      referenceDate,
    });

    expect(plan.addedRecipeCount).toBe(1);
    expect(plan.addedItemCount).toBe(0);
    expect(plan.recipeIdsToMarkAdded.sort()).toEqual(['r1', 'r2']);
    expect(plan.itemIdsToMarkAdded.sort()).toEqual(['i1', 'i2']);
    expect(plan.ingredientsToAdd).toHaveLength(1);
    expect(plan.snapshotReconciliations.map(r => r.mealPlanRecipeId)).toEqual([
      'r1',
    ]);
  });

  it('only bumps lastAddedToListAt for recipes the user owns', () => {
    const plan = planAddMealsToGroceryList({
      recipes: [
        buildRecipe({
          id: 'shared',
          recipe: {
            id: 'recipe-shared',
            user: { id: 'someone-else' },
            recipe_ingredients: [],
          },
        }),
      ],
      items: [],
      userId: 'user-1',
      referenceDate,
    });

    expect(plan.recipeIdsToMarkAdded).toEqual(['shared']);
    expect(plan.ownedRecipeIdsAdded).toEqual([]);
  });
});
