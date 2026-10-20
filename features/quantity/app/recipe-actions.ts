import { id } from '@instantdb/react-native';

import type { AddRecipeToListArgs } from '@/features/recipes/instant/add-recipe-to-list';
import { db } from '@/lib/instant';

import { addEntryToRow } from '../shopping';
import { QuantityTransaction } from '../transaction';

import { chooseDestinations } from './destinations';
import { ingredientFromApp } from './initialize';
import { listSession } from './session';

export async function addQuantityRecipe({
  listId,
  recipeId,
  ingredients,
  defaultStore,
}: AddRecipeToListArgs) {
  const session = listSession(listId);
  const result = await db.queryOnce({
    recipes: { $: { where: { id: recipeId } } },
  });
  const recipe = result.data.recipes[0];
  if (!recipe) throw new Error('Recipe is no longer available');
  const incoming = ingredients.map(i =>
    ingredientFromApp({ ...i, storeId: i.storeId ?? defaultStore?.id })
  );
  const choices = await chooseDestinations(session.state, listId, incoming);
  const tx = new QuantityTransaction(session.state);
  for (const item of incoming)
    addEntryToRow(
      tx,
      id,
      listId,
      item,
      {
        quantity: item.quantity,
        origin: 'recipe',
        sourceName: recipe.name,
        sourceNotes: item.notes,
        sourceDate: '',
        mealTag: '',
        sourceId: null,
        mealId: null,
      },
      choices[item.id]
    );
  await session.send(tx.build(id(), `Add ${recipe.name} from recipe`));
  const stackedCount = incoming.filter(i => choices[i.id]?.rowId).length;
  return {
    requiresConflictResolution: false,
    conflicts: [],
    stackedCount,
    createdCount: incoming.length - stackedCount,
    addedItems: incoming.length,
  };
}

export async function deleteQuantityRecipe(recipeId: string) {
  const { allListSessions } = await import('./session');
  const { records, record } = await import('../model');
  const { operationChunk } = await import('../sync-workspace');
  const sessions = allListSessions().filter(
    ([, session]) => session.state.documents[recipeId]
  );
  const user = await db.getAuth();
  if (!user) throw new Error('Sign in first');
  const operations = sessions.map(([listId, session]) => {
    if (
      !session.canEdit ||
      session.connection !== 'authenticated' ||
      session.pending.length
    )
      throw new Error(
        'Let your list changes finish syncing before deleting this recipe'
      );
    const tx = new QuantityTransaction(session.state);
    const mealIds = new Set(
      records(session.state, 'meal')
        .filter(m => m.recipeId === recipeId)
        .map(m => m.id)
    );
    for (const entry of records(session.state, 'entry').filter(
      e => e.mealId && mealIds.has(e.mealId)
    )) {
      const row = record(session.state, entry.rowId, 'row');
      tx.require(row);
      if (row.status === 'active') tx.remove(entry.id);
      else tx.put({ ...entry, sourceId: null, mealId: null });
    }
    for (const mealId of mealIds) tx.remove(mealId);
    tx.remove(recipeId);
    return operationChunk(
      tx.build(id(), 'Delete recipe and planned meals'),
      listId,
      user.id
    );
  });
  await db.transact([...operations, db.tx.recipes[recipeId].delete()]);
  await Promise.all(sessions.map(([, session]) => session.refresh()));
}
