import { describe, expect, it } from 'vitest';

import { initialOperations } from '../fixtures';
import { groceryProjection } from '../app/projection';
import {
  addRecipe,
  editMealIngredient,
  editMealSchedule,
  removeMeal,
  saveRecipe,
  scheduleMeal,
} from '../meals';
import {
  entriesFor,
  materialize,
  normalize,
  parseQuantity,
  record,
  records,
  totalFor,
} from '../model';
import {
  checkRow,
  deleteRows,
  editQuantity,
  editShoppingDetails,
  extraQuantity,
  manualAdd,
  matchingRows,
  moveRow,
} from '../shopping';
import { QuantityTransaction } from '../transaction';
import { resetExample } from '../reset-example';
import type { Operation } from '../types';

function fixture() {
  let counter = 0;
  const id = () => `id-${String(++counter).padStart(6, '0')}`;
  const operations = initialOperations(id);
  let state = materialize(operations);
  const row = records(state, 'row').find(r => r.unit === 'each')!;
  const meal = records(state, 'meal')[0];
  const recipe = records(state, 'recipe').find(r => r.name === 'Apple butter')!;
  const apply = (...ops: Operation[]) => {
    operations.push(...ops);
    state = materialize(operations);
    return state;
  };
  return {
    id,
    operations,
    get state() {
      return state;
    },
    row,
    meal,
    recipe,
    apply,
  };
}

describe('persistent contribution contract', () => {
  it('resets the test data atomically while retaining the operation history', () => {
    const f = fixture();
    f.apply(extraQuantity(f.state, f.id, f.row.id, 20));
    const before = f.operations.length;
    f.apply(resetExample(f.state, f.id));
    expect(f.operations).toHaveLength(before + 1);
    expect(f.state.conflicts).toHaveLength(0);
    const row = records(f.state, 'row').find(r => r.unit === 'each')!;
    expect(totalFor(f.state, row.id)).toBe(5);
    expect(entriesFor(f.state, row.id)).toHaveLength(3);
    expect(f.state.documents[f.row.id]).toBeUndefined();
  });
  it('fails closed on malformed persisted payloads before they can reach the UI', () => {
    const f = fixture();
    const base = f.operations[0];
    for (const changes of [
      [{ id: '__proto__', before: null, value: null }],
      [{ id: 'bad', before: null, value: { kind: 'mystery', id: 'bad' } }],
      [
        {
          id: 'bad',
          before: null,
          value: { kind: 'meal', id: 'bad', name: 'Meal', ingredients: null },
        },
      ],
    ]) {
      const result = materialize([{ ...base, changes } as Operation]);
      expect(result.complete).toBe(false);
      expect(totalFor(result, f.row.id)).toBeNull();
    }
  });
  it('reconciles recipe ingredient additions, removals and unit changes without touching direct snapshots', () => {
    const f = fixture();
    const recipe = record(f.state, f.meal.recipeId!, 'recipe');
    const ingredient = recipe.ingredients[0];
    const added = {
      ...ingredient,
      id: f.id(),
      name: 'Sugar',
      unit: 'g',
      quantity: 100,
    };
    f.apply(
      saveRecipe(f.state, f.id, {
        ...recipe,
        ingredients: [{ ...ingredient, unit: 'g', quantity: 200 }, added],
      })
    );
    expect(f.state.conflicts).toHaveLength(0);
    expect(totalFor(f.state, f.row.id)).toBe(3);
    expect(
      records(f.state, 'entry')
        .filter(e => e.mealId === f.meal.id)
        .map(e => e.quantity)
        .sort((a, b) => a - b)
    ).toEqual([100, 200]);
    f.apply(
      saveRecipe(f.state, f.id, {
        ...record(f.state, recipe.id, 'recipe'),
        ingredients: [added],
      })
    );
    expect(
      records(f.state, 'entry')
        .filter(e => e.mealId === f.meal.id)
        .map(e => e.quantity)
    ).toEqual([100]);
    expect(totalFor(f.state, f.row.id)).toBe(3);
  });
  it('rejects a stale move atomically if a quantity changed after its read', () => {
    const f = fixture();
    const target = records(f.state, 'list').find(l => l.id !== f.row.listId)!;
    const add = extraQuantity(f.state, f.id, f.row.id, 1);
    const move = moveRow(f.state, f.id, f.row.id, target.id);
    f.apply(add, move);
    expect(f.state.conflicts).toHaveLength(1);
    expect(record(f.state, f.row.id, 'row').listId).toBe(f.row.listId);
    expect(record(f.state, f.meal.id, 'meal').ingredients[0].selected).toBe(
      true
    );
    expect(totalFor(f.state, f.row.id)).toBe(6);
  });
  it('renders the approved 2 + 1 + 2 example, removes 1, and updates only the planned 2', () => {
    const f = fixture();
    expect(f.state.conflicts).toEqual([]);
    expect(totalFor(f.state, f.row.id)).toBe(5);
    const direct = entriesFor(f.state, f.row.id).find(
      e => e.origin === 'recipe'
    )!;
    f.apply(editQuantity(f.state, f.id, direct.id, null));
    expect(totalFor(f.state, f.row.id)).toBe(4);
    f.apply(
      editMealIngredient(f.state, f.id, f.meal.id, f.meal.ingredients[0].id, {
        quantity: 3,
      })
    );
    expect(totalFor(f.state, f.row.id)).toBe(5);
    expect(
      entriesFor(f.state, f.row.id).find(e => e.origin === 'manual')?.quantity
    ).toBe(2);
  });
  it('retains independent concurrent additions and exact retries', () => {
    const f = fixture();
    const a = extraQuantity(f.state, f.id, f.row.id, 0.5);
    const b = extraQuantity(f.state, f.id, f.row.id, 1.25);
    f.apply(b, a, a);
    expect(totalFor(f.state, f.row.id)).toBe(6.75);
    expect(f.state.conflicts).toHaveLength(0);
  });
  it('retains a visible conflict for concurrent same-entry edits in either arrival order', () => {
    const f = fixture();
    const entry = entriesFor(f.state, f.row.id).find(
      e => e.origin === 'manual'
    )!;
    const a = editQuantity(f.state, f.id, entry.id, 7);
    const b = editQuantity(f.state, f.id, entry.id, 9);
    const forward = materialize([...f.operations, a, b]);
    const reverse = materialize([...f.operations, b, a]);
    expect(reverse).toEqual(forward);
    expect(forward.conflicts.map(c => c.operation.id)).toEqual([b.id]);
    expect(record(forward, entry.id, 'entry').quantity).toBe(7);
    f.apply(a, b);
    const resolve = editQuantity(f.state, f.id, entry.id, 9);
    resolve.resolves = [b.id];
    f.apply(resolve);
    expect(f.state.conflicts).toHaveLength(0);
    expect(record(f.state, entry.id, 'entry').quantity).toBe(9);
  });
  it('fails closed on missing parents and altered same-ID retry payloads', () => {
    const f = fixture();
    expect(materialize(f.operations.slice(1)).complete).toBe(false);
    const result = materialize([
      ...f.operations,
      { ...f.operations[0], label: 'Different intent' },
    ]);
    expect(result.complete).toBe(false);
    expect(totalFor(result, f.row.id)).toBeNull();
  });
  it('never changes purchased quantities or creates a delta after source changes and clear', () => {
    const f = fixture();
    f.apply(checkRow(f.state, f.id, f.row.id));
    f.apply(
      editMealIngredient(f.state, f.id, f.meal.id, f.meal.ingredients[0].id, {
        quantity: 8,
      })
    );
    expect(totalFor(f.state, f.row.id)).toBe(5);
    f.apply(deleteRows(f.state, f.id, [f.row.id]));
    f.apply(
      editMealIngredient(f.state, f.id, f.meal.id, f.meal.ingredients[0].id, {
        quantity: 9,
      })
    );
    expect(
      records(f.state, 'row').filter(
        r => r.unit === 'each' && r.status === 'active'
      )
    ).toHaveLength(0);
    expect(record(f.state, f.meal.id, 'meal').ingredients[0].selected).toBe(
      true
    );
  });
  it('detects an add racing a purchase instead of silently losing quantity', () => {
    for (const purchaseFirst of [true, false]) {
      const f = fixture();
      const operations = purchaseFirst
        ? [
            checkRow(f.state, f.id, f.row.id),
            extraQuantity(f.state, f.id, f.row.id, 2),
          ]
        : [
            extraQuantity(f.state, f.id, f.row.id, 2),
            checkRow(f.state, f.id, f.row.id),
          ];
      f.apply(...operations);
      expect(f.state.conflicts).toHaveLength(1);
      expect(totalFor(f.state, f.row.id)).toBe(purchaseFirst ? 5 : 7);
    }
  });
  it('deselects every planned source when deleting a mixed row', () => {
    const f = fixture();
    const ingredient = f.recipe.ingredients[0];
    f.apply(
      scheduleMeal(
        f.state,
        f.id,
        {
          name: 'Snack',
          recipeId: null,
          listId: f.row.listId,
          date: '2026-10-23',
          mealTag: 'Lunch',
          servings: 1,
        },
        [ingredient],
        { [ingredient.id]: { rowId: f.row.id } }
      )
    );
    f.apply(deleteRows(f.state, f.id, [f.row.id]));
    expect(
      records(f.state, 'meal').every(m => m.ingredients.every(i => !i.selected))
    ).toBe(true);
    expect(f.state.conflicts).toHaveLength(0);
  });
  it('keeps direct recipe adds independent and immutable after recipe edits', () => {
    const f = fixture();
    const destinations = { [f.recipe.ingredients[0].id]: { rowId: f.row.id } };
    f.apply(addRecipe(f.state, f.id, f.recipe.id, f.row.listId, destinations));
    f.apply(addRecipe(f.state, f.id, f.recipe.id, f.row.listId, destinations));
    f.apply(
      saveRecipe(f.state, f.id, {
        ...f.recipe,
        name: 'New name',
        ingredients: f.recipe.ingredients.map(i => ({ ...i, quantity: 100 })),
      })
    );
    const direct = entriesFor(f.state, f.row.id).filter(
      e => e.origin === 'recipe'
    );
    expect(direct.map(e => e.quantity)).toEqual([1, 1, 1]);
    expect(direct.every(e => e.sourceName === 'Apple butter')).toBe(true);
  });
  it('scales selected scheduled quantities but preserves an absolute override', () => {
    const f = fixture();
    f.apply(
      editMealSchedule(f.state, f.id, f.meal.id, {
        date: f.meal.date,
        mealTag: 'Lunch',
        servings: 3,
      })
    );
    expect(totalFor(f.state, f.row.id)).toBe(9);
    f.apply(
      editMealIngredient(f.state, f.id, f.meal.id, f.meal.ingredients[0].id, {
        quantity: 4,
      })
    );
    f.apply(
      editMealSchedule(f.state, f.id, f.meal.id, {
        date: f.meal.date,
        mealTag: 'Lunch',
        servings: 5,
      })
    );
    expect(totalFor(f.state, f.row.id)).toBe(7);
  });
  it('rejects editing planned quantities in the grocery sheet', () => {
    const f = fixture();
    const entry = entriesFor(f.state, f.row.id).find(e => e.sourceId)!;
    expect(() => editQuantity(f.state, f.id, entry.id, 4)).toThrow('meal plan');
  });
  it('moves individual quantities atomically and detaches meal links', () => {
    const f = fixture();
    const before = entriesFor(f.state, f.row.id).map(e => e.id);
    const destination = records(f.state, 'list').find(
      l => l.id !== f.row.listId
    )!;
    f.apply(moveRow(f.state, f.id, f.row.id, destination.id));
    expect(entriesFor(f.state, f.row.id).map(e => e.id)).toEqual(before);
    expect(entriesFor(f.state, f.row.id).every(e => e.sourceId === null)).toBe(
      true
    );
    expect(totalFor(f.state, f.row.id)).toBe(5);
    expect(record(f.state, f.meal.id, 'meal').ingredients[0].selected).toBe(
      false
    );
    expect(
      entriesFor(f.state, f.row.id).find(e => e.origin === 'recipe')?.sourceName
    ).toBe('Apple butter');
    f.apply(
      editMealIngredient(f.state, f.id, f.meal.id, f.meal.ingredients[0].id, {
        quantity: 6,
      })
    );
    expect(totalFor(f.state, f.row.id)).toBe(5);
  });
  it('keeps shopping metadata out of recipe and planned source metadata', () => {
    const f = fixture();
    const oldMeal = record(f.state, f.meal.id, 'meal');
    f.apply(
      editShoppingDetails(f.state, f.id, f.row.id, {
        name: 'Green apples',
        notes: 'Shopping note',
        store: 'Other store',
        category: 'Other',
      })
    );
    expect(record(f.state, f.meal.id, 'meal')).toEqual(oldMeal);
    expect(
      entriesFor(f.state, f.row.id).find(e => e.sourceId)?.sourceNotes
    ).toBe('Granny Smith, peeled');
  });
  it('does not combine units, aliases or historical rows and requires a cross-store choice', () => {
    const f = fixture();
    expect(
      matchingRows(f.state, f.row.listId, { name: '  APPLES ', unit: ' EACH ' })
    ).toHaveLength(1);
    expect(
      matchingRows(f.state, f.row.listId, { name: 'Apples', unit: 'ea' })
    ).toHaveLength(0);
    const ingredient = { ...f.recipe.ingredients[0], store: 'Supermarket' };
    expect(() =>
      manualAdd(f.state, f.id, f.row.listId, ingredient, { rowId: f.row.id })
    ).toThrow('store');
    expect(() =>
      manualAdd(
        f.state,
        f.id,
        f.row.listId,
        { ...ingredient, unit: 'g' },
        { rowId: f.row.id, store: 'Supermarket' }
      )
    ).toThrow('same unit');
    f.apply(checkRow(f.state, f.id, f.row.id));
    expect(matchingRows(f.state, f.row.listId, ingredient)).toHaveLength(0);
  });
  it('removes only the deleted meal contribution and preserves other amounts', () => {
    const f = fixture();
    f.apply(removeMeal(f.state, f.id, f.meal.id));
    expect(totalFor(f.state, f.row.id)).toBe(3);
    expect(f.state.conflicts).toHaveLength(0);
  });
  it('validates zero, fractions, invalid and nonfinite input without blank-as-zero', () => {
    expect(['0', '.25', '1,5'].map(parseQuantity)).toEqual([0, 0.25, 1.5]);
    expect(
      ['', '-1', 'Infinity', '2abc', '1,000,000'].map(parseQuantity)
    ).toEqual([null, null, null, null, null]);
    expect(normalize('  fl   OZ ')).toBe('fl oz');
  });
});

it('hides rows emptied by meal removal or deselection but retains explicit zero quantities', () => {
  const f = fixture();
  f.apply(
    scheduleMeal(
      f.state,
      f.id,
      {
        listId: f.row.listId,
        recipeId: null,
        name: 'Unique meal',
        date: '2026-10-25',
        mealTag: '',
        servings: 1,
      },
      [
        {
          id: 'unique-source',
          name: 'Unique avocado',
          quantity: 1,
          unit: 'each',
          notes: '',
          category: '',
          store: '',
        },
      ]
    )
  );
  const meal = records(f.state, 'meal').find(m => m.name === 'Unique meal')!;
  const row = groceryProjection(f.state).find(
    r => r.name === 'Unique avocado'
  )!;
  expect(row.quantity).toBe(1);
  f.apply(
    editMealIngredient(f.state, f.id, meal.id, meal.ingredients[0].id, {
      quantity: 0,
    })
  );
  expect(groceryProjection(f.state).find(r => r.id === row.id)?.quantity).toBe(
    0
  );
  f.apply(
    editMealIngredient(f.state, f.id, meal.id, meal.ingredients[0].id, {
      selected: false,
    })
  );
  expect(groceryProjection(f.state).find(r => r.id === row.id)).toBeUndefined();
  f.apply(
    editMealIngredient(f.state, f.id, meal.id, meal.ingredients[0].id, {
      selected: true,
      quantity: 1,
    })
  );
  expect(
    groceryProjection(f.state).find(r => r.name === 'Unique avocado')?.quantity
  ).toBe(1);
  f.apply(removeMeal(f.state, f.id, meal.id));
  expect(
    groceryProjection(f.state).find(r => r.name === 'Unique avocado')
  ).toBeUndefined();
  expect(f.state.conflicts).toEqual([]);
  expect(
    groceryProjection(f.state).find(r => r.id === f.row.id)?.quantity
  ).toBe(5);
});
