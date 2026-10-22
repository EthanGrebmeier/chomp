import { expect, it } from 'vitest';

import { initialOperations } from '../fixtures';
import { materialize, record, records, totalFor } from '../model';
import { deleteRecipeContributions } from '../recipe-deletion';
import { checkRow } from '../shopping';
import { editMealIngredient, scheduleMeal, saveRecipe } from '../meals';
import type { Operation } from '../types';

function fixture() {
  let i = 0;
  const id = () => `id-${++i}`;
  const history = initialOperations(id);
  const state = materialize(history);
  const meal = records(state, 'meal')[0];
  return {
    id,
    history,
    state,
    meal,
    recipe: record(state, meal.recipeId!, 'recipe'),
  };
}
function committed(history: Operation[], operation: Operation) {
  return {
    ...operation,
    commit: { sequence: 1, parents: materialize(history).heads },
  };
}
it('removes only the deleted recipe’s live amounts and keeps direct/manual quantities', () => {
  const { id, state, history, meal, recipe } = fixture();
  const row = records(state, 'entry').find(e => e.mealId === meal.id)!.rowId;
  const deletion = deleteRecipeContributions(state, id, recipe.id, recipe.name);
  const next = materialize([...history, committed(history, deletion)]);
  expect(next.complete).toBe(true);
  expect(next.conflicts).toEqual([]);
  expect(totalFor(next, row)).toBe(3);
  expect(records(next, 'meal').filter(m => m.recipeId === recipe.id)).toEqual(
    []
  );
  expect(next.documents[recipe.id]).toMatchObject({ deleted: true });
});
it('freezes purchased amounts and detaches their removed live source', () => {
  const { id, state, history, meal, recipe } = fixture();
  const row = records(state, 'entry').find(e => e.mealId === meal.id)!.rowId;
  history.push(checkRow(state, id, row));
  const purchased = materialize(history);
  const deletion = deleteRecipeContributions(
    purchased,
    id,
    recipe.id,
    recipe.name
  );
  const next = materialize([...history, committed(history, deletion)]);
  expect(totalFor(next, row)).toBe(totalFor(purchased, row));
  expect(records(next, 'entry').filter(e => e.mealId === meal.id)).toEqual([]);
});
it('rejects deletion based on an obsolete planned amount', () => {
  const { id, state, history, meal, recipe } = fixture();
  const deletion = deleteRecipeContributions(state, id, recipe.id, recipe.name);
  history.push(
    editMealIngredient(state, id, meal.id, meal.ingredients[0].id, {
      quantity: 9,
    })
  );
  const next = materialize([...history, committed(history, deletion)]);
  expect(next.conflicts.some(c => c.operation.id === deletion.id)).toBe(true);
  expect(next.documents[recipe.id]).not.toHaveProperty('deleted', true);
});
it('rejects a newly scheduled source after its recipe tombstone', () => {
  const { id, state, history, recipe, meal } = fixture();
  const stale = scheduleMeal(
    state,
    id,
    {
      listId: meal.listId,
      name: recipe.name,
      recipeId: recipe.id,
      date: meal.date,
      mealTag: '',
      servings: 1,
    },
    recipe.ingredients
  );
  const deletion = committed(
    history,
    deleteRecipeContributions(state, id, recipe.id, recipe.name)
  );
  history.push(deletion);
  const next = materialize([
    ...history,
    {
      ...stale,
      commit: { sequence: 2, parents: [deletion.id] },
    },
  ]);
  expect(next.conflicts.some(c => c.operation.id === stale.id)).toBe(true);
  expect(records(next, 'meal').filter(m => m.recipeId === recipe.id)).toEqual(
    []
  );
  expect(() => saveRecipe(next, id, recipe)).toThrow('deleted');
});
