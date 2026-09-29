import { describe, expect, it, vi } from 'vitest';

import {
  buildLeaveListCleanupTransactions,
  planLeaveListCleanup,
} from '../build-leave-list-cleanup-transactions';
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
    user: { id: 'leaver' },
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

const othersRecipe = recipeRow('meal-others-recipe', {
  recipe: { id: 'recipe-2', user: { id: 'member' }, recipe_ingredients: [] },
  ingredient_snapshots: [
    snapshot('meal-others-recipe', 'bread', linkedItem('grocery-bread')),
  ],
});

const otherList = recipeRow('meal-other-list', {
  grocery_list: { id: 'list-2' },
  ingredient_snapshots: [
    snapshot('meal-other-list', 'rice', linkedItem('grocery-other-list-rice')),
  ],
});

const leave = (recipeRows: MealPlanRecipeSyncRow[]) => ({
  listId: 'list-1',
  userId: 'leaver',
  recipeRows,
});

describe('planLeaveListCleanup', () => {
  it("targets the list's planned meals that use the leaver's recipes, including ignored ones", () => {
    expect(
      planLeaveListCleanup(
        leave([monday, friday, ignored, othersRecipe, otherList])
      ).mealPlanRecipeIds
    ).toEqual(['meal-monday', 'meal-friday', 'meal-ignored']);
  });

  it('deletes unchecked linked items and unlinks checked or soft-deleted ones', () => {
    const plan = planLeaveListCleanup(leave([monday, friday]));

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

  it("leaves other members' recipes and other lists alone", () => {
    expect(planLeaveListCleanup(leave([othersRecipe, otherList]))).toEqual({
      mealPlanRecipeIds: [],
      deletes: [],
      unlinks: [],
    });
  });

  it('skips rows whose recipe owner is unknown', () => {
    expect(
      planLeaveListCleanup(
        leave([
          recipeRow('meal-no-owner', {
            recipe: { id: 'recipe-1', recipe_ingredients: [] },
          }),
          recipeRow('meal-no-recipe', { recipe: null }),
        ])
      ).mealPlanRecipeIds
    ).toEqual([]);
  });
});

describe('buildLeaveListCleanupTransactions', () => {
  it('deletes the planned meals and unchecked items, unlinking checked ones', () => {
    expect(
      buildLeaveListCleanupTransactions(leave([monday, othersRecipe]))
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
    ]);
  });

  it('is empty when the leaver has no planned meals on the list', () => {
    expect(buildLeaveListCleanupTransactions(leave([othersRecipe]))).toEqual(
      []
    );
  });
});
