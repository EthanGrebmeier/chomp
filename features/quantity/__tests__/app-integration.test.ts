import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), alert: vi.fn(), id: 0 }));
vi.mock('@instantdb/react-native', () => ({ id: () => `id-${++mocks.id}` }));
vi.mock('react-native', () => ({ Alert: { alert: mocks.alert } }));
vi.mock('@/lib/instant', () => ({ db: { queryOnce: mocks.query } }));

import { addQuantityRecipe } from '../app/recipe-actions';
import {
  addManualQuantity,
  bulkQuantityMetadata,
} from '../app/grocery-actions';
import {
  planQuantityRecipe,
  planQuantityItem,
  overrideQuantityIngredient,
  updateQuantityItem,
  selectQuantityIngredients,
  quantitySnapshots,
} from '../app/meal-actions';
import { emptyListSession, publishListSession } from '../app/session';
import { groceryProjection, mealProjection } from '../app/projection';
import { materialize, records, totalFor } from '../model';
import {
  checkRow,
  deleteRows,
  editShoppingDetails,
  extraQuantity,
} from '../shopping';
import { saveRecipe } from '../meals';
import type { Operation } from '../types';

const recipe = {
  id: 'recipe',
  name: 'Apple pie',
  recipe_ingredients: [
    { id: 'ingredient', name: 'Apples', quantity: 2, unit: 'each' },
  ],
};
let history: Operation[];
const state = () => materialize(history);
async function send(operation: Operation) {
  history.push(operation);
  publishListSession('list', {
    ...emptyListSession,
    canEdit: true,
    loading: false,
    state: state(),
    send,
  });
}
beforeEach(async () => {
  vi.clearAllMocks();
  mocks.id = 0;
  mocks.query.mockResolvedValue({ data: { recipes: [recipe], stores: [] } });
  mocks.alert.mockImplementation((_title, _body, buttons) =>
    buttons[1].onPress()
  );
  history = [];
  await send({
    id: 'genesis',
    parents: [],
    guards: [],
    resolves: [],
    label: 'List',
    changes: [
      {
        id: 'list',
        before: null,
        value: { kind: 'list', id: 'list', name: 'Shopping List' },
      },
    ],
  });
});

describe('actual app quantity adapters', () => {
  it('retains saved-item identity through additions, combining, and bulk edits', async () => {
    const item = {
      name: 'Milk',
      quantity: 1,
      unit: 'each',
      notes: 'Whole milk',
    };
    await addManualQuantity('list', item, 'saved-milk');
    const row = records(state(), 'row')[0];
    expect(row.savedItemId).toBe('saved-milk');
    expect(history.at(-1)?.syncSavedItems).toBe(true);
    await addManualQuantity('list', item, 'another-saved-milk');
    expect(records(state(), 'row')).toHaveLength(1);
    expect(records(state(), 'row')[0].savedItemId).toBe('saved-milk');
    expect(totalFor(state(), row.id)).toBe(2);
    await bulkQuantityMetadata([row.id], { category: 'Dairy', store: 'store' });
    expect(records(state(), 'row')[0]).toMatchObject({
      savedItemId: 'saved-milk',
      category: 'Dairy',
      store: 'store',
    });
    expect(history.at(-1)?.syncSavedItems).toBe(true);
    expect(state().conflicts).toEqual([]);
  });
  it('preserves independent direct adds and focuses the exact selected meal ingredient', async () => {
    const planned = await planQuantityRecipe({
      listId: 'list',
      recipeId: recipe.id,
      date: '2026-10-19',
      sourceIngredients: recipe.recipe_ingredients,
    });
    const row = records(state(), 'row')[0];
    await addQuantityRecipe({
      listId: 'list',
      recipeId: recipe.id,
      ingredients: [{ name: 'Apples', quantity: 1, unit: 'Each' }],
    });
    await send(extraQuantity(state(), () => `id-${++mocks.id}`, row.id, 2));
    expect(totalFor(state(), row.id)).toBe(5);
    expect(groceryProjection(state())[0].quantityEntries).toHaveLength(3);
    const source = records(state(), 'meal')[0].ingredients[0];
    expect(source.recipeIngredientId).toBe('ingredient');
    expect(
      groceryProjection(state())[0].quantityEntries?.find(
        e => e.origin === 'scheduled'
      )
    ).toMatchObject({ mealId: planned.id, sourceId: source.id });
    await overrideQuantityIngredient({
      snapshotRowId: source.id,
      updates: { quantity: 3, storeId: 'store' },
      defaultStore: null,
    });
    expect(totalFor(state(), row.id)).toBe(6);
    expect(quantitySnapshots(planned.id)[0]).toMatchObject({
      quantity: 3,
      isQuantityOverridden: true,
      store: { id: 'store' },
    });
    expect(
      mealProjection(state()).recipes[0].ingredient_snapshots?.[0].grocery_item
        ?.quantity
    ).toBe(6);
    await send(
      editShoppingDetails(state(), () => `id-${++mocks.id}`, row.id, {
        name: 'Shopping apples',
        notes: 'Buy ripe',
      })
    );
    expect(records(state(), 'meal')[0].ingredients[0].name).toBe('Apples');
    await selectQuantityIngredients(planned.id, [
      { snapshotRowId: source.id, isSelected: false },
    ]);
    expect(totalFor(state(), row.id)).toBe(3);
    expect(state().conflicts).toEqual([]);
  });

  it('keeps direct recipe snapshots fixed and purchased source quantities frozen', async () => {
    const planned = await planQuantityRecipe({
      listId: 'list',
      recipeId: recipe.id,
      date: '2026-10-19',
      sourceIngredients: recipe.recipe_ingredients,
    });
    const row = records(state(), 'row')[0];
    await addQuantityRecipe({
      listId: 'list',
      recipeId: recipe.id,
      ingredients: recipe.recipe_ingredients,
    });
    const source = records(state(), 'meal')[0].ingredients[0];
    await send(
      saveRecipe(state(), () => `id-${++mocks.id}`, {
        kind: 'recipe',
        id: recipe.id,
        name: recipe.name,
        ingredients: [{ ...source, id: 'ingredient', quantity: 4 }],
      })
    );
    expect(totalFor(state(), row.id)).toBe(6);
    expect(
      records(state(), 'entry').find(e => e.origin === 'recipe')?.quantity
    ).toBe(2);
    await send(checkRow(state(), () => `id-${++mocks.id}`, row.id));
    await overrideQuantityIngredient({
      snapshotRowId: source.id,
      updates: { quantity: 8 },
      defaultStore: null,
    });
    expect(totalFor(state(), row.id)).toBe(6);
    await send(deleteRows(state(), () => `id-${++mocks.id}`, [row.id]));
    await overrideQuantityIngredient({
      snapshotRowId: source.id,
      updates: { quantity: 9 },
      defaultStore: null,
    });
    expect(groceryProjection(state())).toEqual([]);
    expect(mealProjection(state()).recipes[0].id).toBe(planned.id);
  });

  it('supports standalone decimals, mixed-row deletion, and incompatible units', async () => {
    const item = await planQuantityItem({
      listId: 'list',
      name: 'Apples',
      quantity: 0.5,
      unit: 'kg',
      date: '2026-10-19',
    });
    await updateQuantityItem({
      mealPlanItemId: item.id,
      updates: { quantity: 0.75, notes: 'For lunch' },
      defaultStore: null,
    });
    expect(groceryProjection(state())[0].quantity).toBe(0.75);
    await addQuantityRecipe({
      listId: 'list',
      recipeId: recipe.id,
      ingredients: recipe.recipe_ingredients,
    });
    expect(mocks.alert).not.toHaveBeenCalled();
    expect(
      groceryProjection(state())
        .map(r => r.unit)
        .sort()
    ).toEqual(['each', 'kg']);
    const row = records(state(), 'row').find(r => r.unit === 'kg')!;
    await send(extraQuantity(state(), () => `id-${++mocks.id}`, row.id, 0.25));
    await send(deleteRows(state(), () => `id-${++mocks.id}`, [row.id]));
    expect(mealProjection(state()).items[0].ignoredByGroceryList).toBe(true);
    expect(groceryProjection(state())).toHaveLength(1);
    expect(state().conflicts).toEqual([]);
  });

  it('keeps a meal off the grocery list when its recipe gains an ingredient', async () => {
    const planned = await planQuantityRecipe({
      listId: 'list',
      recipeId: recipe.id,
      date: '2026-10-19',
      sourceIngredients: recipe.recipe_ingredients,
    });
    const source = records(state(), 'meal')[0].ingredients[0];
    await selectQuantityIngredients(planned.id, [
      { snapshotRowId: source.id, isSelected: false },
    ]);
    const storedRecipe = records(state(), 'recipe')[0];
    await send(
      saveRecipe(state(), () => `id-${++mocks.id}`, {
        ...storedRecipe,
        ingredients: [
          ...storedRecipe.ingredients,
          {
            ...storedRecipe.ingredients[0],
            id: 'new-ingredient',
            name: 'Sugar',
          },
        ],
      })
    );
    expect(records(state(), 'meal')[0].ingredients).toHaveLength(2);
    expect(
      records(state(), 'meal')[0].ingredients.every(i => !i.selected)
    ).toBe(true);
    expect(records(state(), 'entry')).toEqual([]);
    expect(state().conflicts).toEqual([]);
  });
});
