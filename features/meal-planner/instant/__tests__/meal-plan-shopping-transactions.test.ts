import { beforeEach, describe, expect, it, vi } from 'vitest';

const { transact, query } = vi.hoisted(() => ({
  transact: vi.fn(),
  query: vi.fn(),
}));
vi.mock('../../../../lib/instant', () => ({ db: { transact } }));
vi.mock('../query-meal-plan-entry-sync-rows', () => ({
  queryMealPlanRecipeSyncRow: query,
}));
vi.mock('@instantdb/react-native', () => ({
  id: () => 'new-grocery',
  tx: new Proxy(
    {},
    {
      get: (_, namespace) =>
        new Proxy(
          {},
          {
            get: (_, entityId) =>
              Object.fromEntries(
                ['update', 'link', 'unlink', 'delete'].map(operation => [
                  operation,
                  (payload?: unknown) => ({
                    namespace,
                    entityId,
                    operation,
                    payload,
                  }),
                ])
              ),
          }
        ),
    }
  ),
}));
import { setMealPlanEntryIgnored } from '../meal-plan-entry';

const meal = (isChecked: boolean, isDeleted = false) => ({
  id: 'meal',
  servings: 1,
  ignoredByGroceryList: false,
  grocery_list: { id: 'list' },
  recipe: {
    id: 'recipe',
    recipe_ingredients: [
      { id: 'rice', name: 'Rice', quantity: 2, unit: 'cup' },
    ],
  },
  ingredient_snapshots: [
    {
      id: 'snapshot',
      sourceRecipeIngredientId: 'rice',
      name: 'Rice',
      quantity: 2,
      unit: 'cup',
      isSelected: true,
      isQuantityOverridden: false,
      grocery_item: {
        id: 'old-grocery',
        name: 'Rice',
        quantity: 2,
        unit: 'cup',
        isChecked,
        isDeleted,
      },
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
  transact.mockResolvedValue(undefined);
});

describe('explicit shopping transactions', () => {
  it('hides a purchase and saves the entry flag in one transaction without unlinking history', async () => {
    query.mockResolvedValue(meal(true));
    await setMealPlanEntryIgnored({
      type: 'recipe',
      id: 'meal',
      ignored: true,
      defaultStore: null,
    });
    expect(transact).toHaveBeenCalledOnce();
    const writes = transact.mock.calls[0][0];
    expect(writes).toContainEqual({
      namespace: 'meal_plan_recipes',
      entityId: 'meal',
      operation: 'update',
      payload: expect.objectContaining({ ignoredByGroceryList: true }),
    });
    expect(writes).toContainEqual({
      namespace: 'grocery_items',
      entityId: 'old-grocery',
      operation: 'update',
      payload: expect.objectContaining({ isDeleted: true }),
    });
    expect(
      writes.some(
        (write: { operation: string }) =>
          write.operation === 'unlink' || write.operation === 'delete'
      )
    ).toBe(false);
  });

  it('restores cleared purchases atomically without resetting or replacing them', async () => {
    query.mockResolvedValue(meal(true, true));
    await setMealPlanEntryIgnored({
      type: 'recipe',
      id: 'meal',
      ignored: false,
      defaultStore: { id: 'store', name: 'Store' },
    });
    expect(transact).toHaveBeenCalledOnce();
    const writes = transact.mock.calls[0][0];
    expect(writes).toEqual([
      {
        namespace: 'meal_plan_recipes',
        entityId: 'meal',
        operation: 'update',
        payload: expect.objectContaining({ ignoredByGroceryList: false }),
      },
      {
        namespace: 'grocery_items',
        entityId: 'old-grocery',
        operation: 'update',
        payload: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: expect.any(String),
        },
      },
    ]);
  });
});
