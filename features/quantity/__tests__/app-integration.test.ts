import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), alert: vi.fn(), id: 0 }));
vi.mock('@instantdb/react-native', () => ({ id: () => `id-${++mocks.id}` }));
vi.mock('react-native', () => ({ Alert: { alert: mocks.alert } }));
vi.mock('@/lib/instant', () => ({ db: { queryOnce: mocks.query } }));

import { updateQuantityChecked } from '../app/checked-state';
import { addQuantityRecipe } from '../app/recipe-actions';
import {
  addManualQuantity,
  bulkQuantityMetadata,
} from '../app/grocery-actions';
import {
  planQuantityRecipe,
  planQuantityItem,
  removeQuantityMeals,
  overrideQuantityIngredient,
  updateQuantityItem,
  selectQuantityIngredients,
  quantitySnapshots,
} from '../app/meal-actions';
import { emptyListSession, publishListSession } from '../app/session';
import {
  groceryProjection,
  mealProjection,
  createGroceryProjector,
} from '../app/projection';
import { readWorkspaceState, type Pending } from '../sync-workspace';
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

  it('plans a standalone item without shopping demand and can include it later', async () => {
    const item = await planQuantityItem({
      listId: 'list',
      name: 'Apples',
      quantity: 2,
      unit: 'each',
      date: '2026-10-30',
      showOnGroceryList: false,
    });
    expect(mealProjection(state()).items[0].id).toBe(item.id);
    expect(groceryProjection(state())).toEqual([]);
    const meal = records(state(), 'meal').find(m => m.id === item.id)!;
    await selectQuantityIngredients(item.id, [
      { snapshotRowId: meal.ingredients[0].id, isSelected: true },
    ]);
    expect(groceryProjection(state())[0].quantity).toBe(2);
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

describe('recipe store review integration', () => {
  it('waits for review, keeps source quantities, and moves the combined row to the chosen store', async () => {
    const { registerStoreReviewer } = await import('../app/store-review');
    await addManualQuantity('list', {
      name: 'Apples',
      quantity: 3,
      unit: 'each',
      storeId: 'a',
    });
    const before = history.length;
    const review = vi.fn(async request => {
      expect(history).toHaveLength(before);
      expect(request.conflicts).toHaveLength(1);
      const conflict = request.conflicts[0];
      return {
        [conflict.item.id]: { rowId: conflict.rows[0].row.id, store: '' },
      };
    });
    const unregister = registerStoreReviewer(review);
    try {
      await addQuantityRecipe({
        listId: 'list',
        recipeId: 'recipe',
        ingredients: [{ name: 'Apples', quantity: 2, unit: 'each' }],
      });
      const rows = records(state(), 'row');
      expect(rows).toHaveLength(1);
      expect(rows[0].store).toBe('');
      expect(totalFor(state(), rows[0].id)).toBe(5);
      expect(records(state(), 'entry')).toHaveLength(2);
      expect(review).toHaveBeenCalledOnce();
    } finally {
      unregister();
    }
  });
  it('cancels the whole recipe, including items without conflicts', async () => {
    const { registerStoreReviewer } = await import('../app/store-review');
    await addManualQuantity('list', {
      name: 'Apples',
      quantity: 3,
      unit: 'each',
      storeId: 'a',
    });
    const before = history.length;
    const unregister = registerStoreReviewer(async () => {
      throw new Error('Addition cancelled');
    });
    try {
      await expect(
        addQuantityRecipe({
          listId: 'list',
          recipeId: 'recipe',
          ingredients: [
            { name: 'Apples', quantity: 2, unit: 'each' },
            { name: 'Milk', quantity: 1, unit: 'l' },
          ],
        })
      ).rejects.toThrow('cancelled');
      expect(history).toHaveLength(before);
    } finally {
      unregister();
    }
  });
  it('refreshes review when quantities change while the sheet is open', async () => {
    const { registerStoreReviewer } = await import('../app/store-review');
    await addManualQuantity('list', {
      name: 'Apples',
      quantity: 3,
      unit: 'each',
      storeId: 'a',
    });
    const row = records(state(), 'row')[0];
    const review = vi.fn(async request => {
      if (!request.changed)
        await send(extraQuantity(state(), () => `id-${++mocks.id}`, row.id, 1));
      else expect(request.conflicts[0].rows[0].quantity).toBe(4);
      return { [request.conflicts[0].item.id]: {} };
    });
    const unregister = registerStoreReviewer(review);
    try {
      await addQuantityRecipe({
        listId: 'list',
        recipeId: 'recipe',
        ingredients: [{ name: 'Apples', quantity: 2, unit: 'each' }],
      });
      expect(review).toHaveBeenCalledTimes(2);
      expect(records(state(), 'row')).toHaveLength(2);
      expect(state().conflicts).toEqual([]);
    } finally {
      unregister();
    }
  });
});

it('keeps manual quantity when a meal combined across stores is removed', async () => {
  const { registerStoreReviewer } = await import('../app/store-review');
  await addManualQuantity('list', {
    name: 'Apples',
    quantity: 3,
    unit: 'each',
    storeId: 'a',
  });
  const review = vi.fn(async request => ({
    [request.conflicts[0].item.id]: {
      rowId: request.conflicts[0].rows[0].row.id,
      store: 'a',
    },
  }));
  const unregister = registerStoreReviewer(review);
  try {
    const meal = await planQuantityRecipe({
      listId: 'list',
      recipeId: recipe.id,
      date: '2026-10-20',
      sourceIngredients: recipe.recipe_ingredients,
    });
    const row = records(state(), 'row')[0];
    expect(totalFor(state(), row.id)).toBe(5);
    expect(review).toHaveBeenCalledOnce();
    await removeQuantityMeals([meal.id]);
    expect(totalFor(state(), row.id)).toBe(3);
    expect(state().conflicts).toEqual([]);
  } finally {
    unregister();
  }
});

describe('direct item store review', () => {
  it('automatically combines matching stores and keeps different units separate', async () => {
    const item = { name: 'Apples', quantity: 2, unit: 'each', storeId: 'a' };
    await addManualQuantity('list', item);
    await addManualQuantity('list', { ...item, quantity: 3 });
    await addManualQuantity('list', { ...item, unit: 'kg' });
    expect(records(state(), 'row')).toHaveLength(2);
    const row = records(state(), 'row').find(row => row.unit === 'each')!;
    expect(totalFor(state(), row.id)).toBe(5);
    expect(records(state(), 'entry')).toHaveLength(3);
    expect(mocks.alert).not.toHaveBeenCalled();
  });

  it.each(['separate', 'existing', 'incoming'] as const)(
    'reviews different stores and applies %s',
    async choice => {
      const { registerStoreReviewer } = await import('../app/store-review');
      await addManualQuantity(
        'list',
        { name: 'Apples', quantity: 3, unit: 'each', storeId: 'a' },
        'saved-apples'
      );
      const rowId = records(state(), 'row')[0].id;
      const review = vi.fn(async request => {
        expect(request.conflicts).toHaveLength(1);
        const conflict = request.conflicts[0];
        expect(conflict.item.store).toBe('b');
        return {
          [conflict.item.id]:
            choice === 'separate'
              ? {}
              : { rowId, store: choice === 'existing' ? 'a' : 'b' },
        };
      });
      const unregister = registerStoreReviewer(review);
      try {
        await addManualQuantity(
          'list',
          { name: 'Apples', quantity: 2, unit: 'each', storeId: 'b' },
          'other-saved-apples'
        );
        expect(review).toHaveBeenCalledOnce();
        expect(records(state(), 'row')).toHaveLength(
          choice === 'separate' ? 2 : 1
        );
        expect(totalFor(state(), rowId)).toBe(choice === 'separate' ? 3 : 5);
        expect(state().documents[rowId]).toMatchObject({
          store: choice === 'incoming' ? 'b' : 'a',
          savedItemId: 'saved-apples',
        });
        expect(records(state(), 'entry')).toHaveLength(2);
        expect(state().conflicts).toEqual([]);
        expect(mocks.alert).not.toHaveBeenCalled();
      } finally {
        unregister();
      }
    }
  );

  it('does not add an item when store review is cancelled', async () => {
    const { registerStoreReviewer } = await import('../app/store-review');
    await addManualQuantity('list', {
      name: 'Apples',
      quantity: 3,
      unit: 'each',
      storeId: 'a',
    });
    const before = history.length;
    const unregister = registerStoreReviewer(async () => {
      throw new Error('Addition cancelled');
    });
    try {
      await expect(
        addManualQuantity('list', {
          name: 'Apples',
          quantity: 2,
          unit: 'each',
          storeId: 'b',
        })
      ).rejects.toThrow('cancelled');
      expect(history).toHaveLength(before);
    } finally {
      unregister();
    }
  });
});

it('serializes rapid checkbox reversals against the published quantity model', async () => {
  await addManualQuantity('list', { name: 'Milk', quantity: 2, unit: 'each' });
  const row = records(state(), 'row')[0];
  await Promise.all([
    updateQuantityChecked([{ itemId: row.id, isChecked: true }]),
    updateQuantityChecked([{ itemId: row.id, isChecked: false }]),
    updateQuantityChecked([{ itemId: row.id, isChecked: true }]),
  ]);
  expect(state().conflicts).toEqual([]);
  expect(state().documents[row.id]).toMatchObject({ status: 'checked' });
  expect(totalFor(state(), row.id)).toBe(2);
});

it('preserves unchanged projected row references across replay but refreshes changed quantities', async () => {
  await addManualQuantity('list', { name: 'Milk', quantity: 2, unit: 'each' });
  await addManualQuantity('list', { name: 'Bread', quantity: 1, unit: 'each' });
  const project = createGroceryProjector();
  const before = project(state());
  const milk = before.find(row => row.name === 'Milk')!;
  const bread = before.find(row => row.name === 'Bread')!;
  expect(project(state()).find(row => row.id === milk.id)).toBe(milk);
  await updateQuantityChecked([{ itemId: milk.id, isChecked: true }]);
  const checked = project(state());
  expect(checked.find(row => row.id === milk.id)).toMatchObject({
    isChecked: true,
    quantity: 2,
  });
  expect(checked.find(row => row.id === milk.id)).not.toBe(milk);
  expect(checked.find(row => row.id === bread.id)).toBe(bread);
  await send(extraQuantity(state(), () => `id-${++mocks.id}`, bread.id, 3));
  const edited = project(state()).find(row => row.id === bread.id)!;
  expect(edited).not.toBe(bread);
  expect(edited.quantity).toBe(4);
  expect(
    project({ ...state(), complete: false }).find(row => row.id === bread.id)
      ?.quantity
  ).toBe(0);
});

it('keeps rapid offline checkbox edits in the durable outbox with valid version guards', async () => {
  await addManualQuantity('list', { name: 'Milk', quantity: 2, unit: 'each' });
  const row = records(state(), 'row')[0];
  const committed = history.map(operation => ({
    id: operation.id,
    body: JSON.stringify(operation),
  }));
  const pending: Pending[] = [];
  const offlineState = () => readWorkspaceState([], pending, committed, 1);
  const publish = () =>
    publishListSession('list', {
      ...emptyListSession,
      state: offlineState(),
      canEdit: true,
      loading: false,
      connection: 'closed',
      pending: [...pending],
      send: async operation => {
        // Model publication follows successful local persistence, without a server ack.
        await Promise.resolve();
        pending.push({ operation });
        publish();
      },
    });
  publish();
  await Promise.all([
    updateQuantityChecked([{ itemId: row.id, isChecked: true }]),
    updateQuantityChecked([{ itemId: row.id, isChecked: false }]),
  ]);
  expect(pending).toHaveLength(2);
  expect(offlineState().conflicts).toEqual([]);
  expect(offlineState().documents[row.id]).toMatchObject({ status: 'active' });
  expect(totalFor(offlineState(), row.id)).toBe(2);
  // A fresh reconstruction from the saved outbox retains both operations.
  const reloaded = readWorkspaceState(
    [],
    JSON.parse(JSON.stringify(pending)),
    committed,
    1
  );
  expect(reloaded).toEqual(offlineState());
});

it('records purchase time, removes it on undo, and dates the next purchase anew', async () => {
  await addManualQuantity('list', { name: 'Milk', quantity: 1, unit: 'each' });
  const row = records(state(), 'row')[0];
  await updateQuantityChecked([{ itemId: row.id, isChecked: true }]);
  const purchased = records(state(), 'row')[0];
  expect(purchased.purchasedAt).toEqual(expect.any(String));
  await updateQuantityChecked([{ itemId: row.id, isChecked: true }]);
  expect(records(state(), 'row')[0].purchasedAt).toBe(purchased.purchasedAt);
  await updateQuantityChecked([{ itemId: row.id, isChecked: false }]);
  expect(records(state(), 'row')[0].purchasedAt).toBeUndefined();
  await updateQuantityChecked([{ itemId: row.id, isChecked: true }]);
  expect(records(state(), 'row')[0].purchasedAt).toEqual(expect.any(String));
});
