import { addRecipe, scheduleMeal } from './meals';
import { materialize, records } from './model';
import { manualAdd } from './shopping';
import { QuantityTransaction } from './transaction';
import type { Ingredient, Operation, Recipe } from './types';

/** Seed once into a new isolated workspace. These are real persisted quantities. */
export function initialOperations(newId: () => string): Operation[] {
  const operations: Operation[] = [];
  let state = materialize(operations);
  const tx = new QuantityTransaction(state);
  const listId = newId();
  tx.put({ kind: 'list', id: listId, name: 'Weekly shop' });
  tx.put({ kind: 'list', id: newId(), name: 'Weekend shop' });
  const apples: Ingredient = {
    id: newId(),
    name: 'Apples',
    quantity: 2,
    unit: 'each',
    notes: 'Granny Smith, peeled',
    category: 'produce',
    store: 'Farmers market',
  };
  const pie: Recipe = {
    kind: 'recipe',
    id: newId(),
    name: 'Apple pie',
    ingredients: [apples],
  };
  const butter: Recipe = {
    kind: 'recipe',
    id: newId(),
    name: 'Apple butter',
    ingredients: [
      { ...apples, id: newId(), quantity: 1, notes: 'Any sweet variety' },
    ],
  };
  tx.put(pie);
  tx.put(butter);
  operations.push(tx.build(newId(), 'Create quantity workspace'));
  const append = (op: Operation) => {
    operations.push(op);
    state = materialize(operations);
  };
  state = materialize(operations);
  const today = new Date();
  const friday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + ((5 - today.getDay() + 7) % 7)
  );
  const date = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`;
  append(
    scheduleMeal(
      state,
      newId,
      {
        listId,
        name: pie.name,
        recipeId: pie.id,
        date,
        mealTag: 'Dinner',
        servings: 1,
      },
      pie.ingredients
    )
  );
  const row = records(state, 'row')[0];
  append(
    addRecipe(state, newId, butter.id, listId, {
      [butter.ingredients[0].id]: { rowId: row.id },
    })
  );
  append(
    manualAdd(
      state,
      newId,
      listId,
      { ...apples, notes: '', quantity: 2 },
      { rowId: row.id }
    )
  );
  append(
    manualAdd(state, newId, listId, {
      ...apples,
      notes: '',
      quantity: 500,
      unit: 'g',
    })
  );
  return operations;
}
