import { id } from '@instantdb/react-native';

import type { AddRecipeToListArgs } from '@/features/recipes/instant/add-recipe-to-list';
import { db } from '@/lib/instant';

import { commitOperations, decodeHistory } from '../commits';
import { quantityCommitStore } from '../instant-commit-store';
import { materialize } from '../model';
import { deleteRecipeContributions } from '../recipe-deletion';
import { addEntryToRow } from '../shopping';
import { QuantityTransaction } from '../transaction';

import { chooseDestinations } from './destinations';
import { ingredientFromApp, ensureQuantityList } from './initialize';
import { listSession, allListSessions } from './session';

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
  const user = await db.getAuth();
  if (!user) throw new Error('Sign in first');
  // Loaded screens are not an inventory: include every accessible list, even
  // one whose provider has not initialized yet.
  const { data } = await db.queryOnce(
    {
      grocery_lists: {},
      recipes: { $: { where: { id: recipeId } } },
    },
    { ruleParams: { quantityDelete: id() } }
  );
  const recipe = data.recipes[0];
  if (!recipe) return;
  for (const [, session] of allListSessions()) {
    if (session.pending.length || session.connection !== 'authenticated')
      throw new Error(
        'Let your list changes finish syncing before deleting this recipe'
      );
  }
  const store = quantityCommitStore(user.id, [
    db.tx.recipes[recipeId].delete(),
  ]);
  const plans = await Promise.all(
    data.grocery_lists.map(async list => {
      await ensureQuantityList(list.id, user.id);
      const history = decodeHistory(await store.read(list.id));
      return {
        workspaceId: list.id,
        operation: deleteRecipeContributions(
          materialize(history),
          id,
          recipeId,
          recipe.name
        ),
      };
    })
  );
  if (plans.length) await commitOperations(store, plans, user.id, true);
  else await db.transact(db.tx.recipes[recipeId].delete());
  await Promise.all(allListSessions().map(([, session]) => session.refresh()));
}
