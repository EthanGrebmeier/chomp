import { record, records } from './model';
import type { NewId } from './shopping';
import { QuantityTransaction } from './transaction';
import type { QuantityState } from './types';

export function deleteRecipeContributions(
  state: QuantityState,
  newId: NewId,
  recipeId: string,
  name: string
) {
  const tx = new QuantityTransaction(state);
  tx.requireRecipeMeals(recipeId);
  const meals = records(state, 'meal').filter(m => m.recipeId === recipeId);
  const mealIds = new Set(meals.map(m => m.id));
  for (const entry of records(state, 'entry').filter(
    e => e.mealId && mealIds.has(e.mealId)
  )) {
    const row = record(state, entry.rowId, 'row');
    tx.require(row);
    if (row.status === 'active') tx.remove(entry.id);
    else tx.put({ ...entry, sourceId: null, mealId: null });
  }
  for (const meal of meals) tx.remove(meal.id);
  // Keep a tombstone even in lists without a current meal. An offline/stale
  // schedule must not recreate a live source after the catalog recipe is gone.
  tx.put({
    kind: 'recipe',
    id: recipeId,
    name,
    ingredients: [],
    deleted: true,
  });
  return tx.build(newId(), `Delete ${name} and planned meals`);
}
