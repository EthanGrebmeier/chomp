import { expect, it, vi } from 'vitest';

import { buildLegacyQuantityOperation } from '../app/legacy-import';
import { groceryProjection, mealProjection } from '../app/projection';
import { materialize } from '../model';

it('projects a large migrated list without rescanning every document for every meal or row', () => {
  let nextId = 0;
  const operation = buildLegacyQuantityOperation(
    {
      id: 'list',
      name: 'Large list',
      grocery_items: Array.from({ length: 1100 }, (_, i) => ({
        id: `row-${i}`,
        name: `Item ${i}`,
        quantity: 1.25,
        unit: 'each',
        isChecked: i % 2 === 0,
        isDeleted: i === 1099,
      })),
      meal_plan_items: Array.from({ length: 80 }, (_, i) => ({
        id: `meal-${i}`,
        name: `Meal ${i}`,
        quantity: 2,
        unit: 'each',
        date: '2026-10-21',
      })),
      meal_plan_recipes: [],
    },
    () => `generated-${++nextId}`
  );
  const state = materialize([operation]);
  expect(state.complete).toBe(true);
  expect(state.conflicts).toEqual([]);
  const enumerate = vi.fn(Reflect.ownKeys);
  const indexedState = {
    ...state,
    documents: new Proxy(state.documents, { ownKeys: enumerate }),
  };
  const meals = mealProjection(indexedState);
  expect(meals.items).toHaveLength(80);
  expect(meals.items[0]).toMatchObject({
    quantity: 2,
    ignoredByGroceryList: true,
  });
  expect(enumerate.mock.calls.length).toBeLessThan(10);

  enumerate.mockClear();
  const groceries = groceryProjection(indexedState);
  expect(groceries).toHaveLength(1099);
  expect(groceries[0]).toMatchObject({ quantity: 1.25, isChecked: true });
  expect(groceries[0].quantityEntries).toHaveLength(1);
  expect(enumerate.mock.calls.length).toBeLessThan(10);
  expect(groceryProjection({ ...state, complete: false })[0].quantity).toBe(0);
});
