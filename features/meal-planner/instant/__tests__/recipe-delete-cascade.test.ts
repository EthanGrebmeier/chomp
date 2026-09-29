import { describe, expect, it, vi } from 'vitest';

import {
  buildRecipeDeleteCascadeTransactions,
  planRecipeDeleteCascade,
} from '../build-recipe-delete-cascade-transactions';
import type { MealPlanRecipeSyncRow } from '../meal-plan-entry-sync-context';
import type { LinkedGroceryItemForSync } from '../plan-meal-plan-list-sync';

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
  name: id,
  quantity: 1,
  unit: 'each',
  isChecked: false,
  isDeleted: false,
  ...overrides,
});

const snapshot = (
  mealPlanRecipeId: string,
  sourceId: string,
  grocery_item: LinkedGroceryItemForSync | null,
  isSelected = true
): NonNullable<MealPlanRecipeSyncRow['ingredient_snapshots']>[number] => ({
  id: `snapshot-${mealPlanRecipeId}-${sourceId}`,
  sourceRecipeIngredientId: sourceId,
  name: sourceId,
  quantity: 1,
  unit: 'each',
  isSelected,
  isQuantityOverridden: false,
  grocery_item,
});

const recipeRow = (
  id: string,
  overrides: Partial<MealPlanRecipeSyncRow> = {}
): MealPlanRecipeSyncRow => ({
  id,
  servings: 1,
  ignoredByGroceryList: false,
  grocery_list: { id: 'list-1' },
  recipe: {
    id: 'recipe-1',
    recipe_ingredients: [
      { id: 'rice', name: 'rice', quantity: 1, unit: 'each' },
      { id: 'salt', name: 'salt', quantity: 1, unit: 'each' },
    ],
  },
  ingredient_snapshots: [],
  ...overrides,
});

const monday = recipeRow('meal-monday', {
  ingredient_snapshots: [
    snapshot('meal-monday', 'rice', linkedItem('grocery-monday-rice')),
    snapshot(
      'meal-monday',
      'salt',
      linkedItem('grocery-monday-salt', { isChecked: true })
    ),
  ],
});

const friday = recipeRow('meal-friday', {
  grocery_list: { id: 'list-2' },
  ingredient_snapshots: [
    snapshot('meal-friday', 'rice', linkedItem('grocery-friday-rice')),
    snapshot(
      'meal-friday',
      'salt',
      linkedItem('grocery-friday-salt', { isDeleted: true })
    ),
  ],
});

const ignored = recipeRow('meal-ignored', {
  ignoredByGroceryList: true,
  ingredient_snapshots: [snapshot('meal-ignored', 'rice', null, false)],
});

const otherRecipe = recipeRow('meal-other-recipe', {
  recipe: { id: 'recipe-2', recipe_ingredients: [] },
  ingredient_snapshots: [
    snapshot('meal-other-recipe', 'bread', linkedItem('grocery-bread')),
  ],
});

describe('planRecipeDeleteCascade', () => {
  it('targets every planned meal using the recipe, including ignored ones', () => {
    expect(
      planRecipeDeleteCascade({
        recipeId: 'recipe-1',
        recipeRows: [monday, friday, ignored],
      }).mealPlanRecipeIds
    ).toEqual(['meal-monday', 'meal-friday', 'meal-ignored']);
  });

  it('deletes unchecked linked items and unlinks checked or soft-deleted ones', () => {
    const plan = planRecipeDeleteCascade({
      recipeId: 'recipe-1',
      recipeRows: [monday, friday],
    });

    expect(plan.deletes.map(change => change.groceryItemId)).toEqual([
      'grocery-monday-rice',
      'grocery-friday-rice',
    ]);
    expect(plan.unlinks).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-meal-monday-salt' },
        groceryItemId: 'grocery-monday-salt',
      },
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-meal-friday-salt' },
        groceryItemId: 'grocery-friday-salt',
      },
    ]);
  });

  it('leaves planned meals of other recipes alone', () => {
    expect(
      planRecipeDeleteCascade({
        recipeId: 'recipe-1',
        recipeRows: [otherRecipe],
      })
    ).toEqual({ mealPlanRecipeIds: [], deletes: [], unlinks: [] });
  });

  it('plans nothing when the recipe is not planned', () => {
    expect(
      planRecipeDeleteCascade({ recipeId: 'recipe-1', recipeRows: [] })
    ).toEqual({ mealPlanRecipeIds: [], deletes: [], unlinks: [] });
  });
});

describe('buildRecipeDeleteCascadeTransactions', () => {
  it('deletes the recipe with its planned meals and unchecked items in one transaction', () => {
    expect(
      buildRecipeDeleteCascadeTransactions({
        recipeId: 'recipe-1',
        recipeRows: [monday, otherRecipe],
      })
    ).toEqual([
      {
        operation: 'delete',
        namespace: 'grocery_items',
        entityId: 'grocery-monday-rice',
        payload: undefined,
      },
      {
        operation: 'unlink',
        namespace: 'grocery_items',
        entityId: 'grocery-monday-salt',
        payload: { meal_plan_ingredient_snapshot: 'snapshot-meal-monday-salt' },
      },
      {
        operation: 'delete',
        namespace: 'meal_plan_recipes',
        entityId: 'meal-monday',
        payload: undefined,
      },
      {
        operation: 'delete',
        namespace: 'recipes',
        entityId: 'recipe-1',
        payload: undefined,
      },
    ]);
  });

  it('only deletes the recipe when it is not planned', () => {
    expect(
      buildRecipeDeleteCascadeTransactions({
        recipeId: 'recipe-1',
        recipeRows: [],
      })
    ).toEqual([
      {
        operation: 'delete',
        namespace: 'recipes',
        entityId: 'recipe-1',
        payload: undefined,
      },
    ]);
  });
});
