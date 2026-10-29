import { id } from '@instantdb/react-native';

import { db } from '@/lib/instant';

import { commitOperations } from '../commits';
import { quantityCommitStore } from '../instant-commit-store';
import { materialize } from '../model';
import { operationChunk } from '../sync-workspace';
import { QuantityTransaction } from '../transaction';
import type { Ingredient, Operation, Recipe } from '../types';

import { buildLegacyQuantityOperation } from './legacy-import';

export function ingredientFromApp(item: {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string;
  store?: { id: string } | null;
}): Ingredient {
  return {
    id: item.id ?? id(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes ?? '',
    category: item.category ?? '',
    store: item.storeId ?? item.store?.id ?? '',
  };
}
export function recipeFromApp(recipe: {
  id: string;
  name: string;
  recipe_ingredients: Parameters<typeof ingredientFromApp>[0][];
}): Recipe {
  return {
    kind: 'recipe',
    id: recipe.id,
    name: recipe.name,
    ingredients: recipe.recipe_ingredients.map(ingredientFromApp),
  };
}
const inFlight = new Map<string, Promise<void>>();
export function ensureQuantityList(listId: string, userId: string) {
  const key = `${userId}:${listId}`;
  const current = inFlight.get(key);
  if (current) return current;
  const promise = initialize(listId, userId).finally(() =>
    inFlight.delete(key)
  );
  inFlight.set(key, promise);
  return promise;
}
async function initialize(listId: string, userId: string) {
  const existing = await db.queryOnce(
    {
      gqc_workspaces_v1: { $: { where: { id: listId } } },
      gqc_operations_v1: { $: { where: { workspaceId: listId } } },
      grocery_items: {
        $: { where: { 'grocery_list.id': listId } },
        saved_item: {},
      },
    },
    { ruleParams: { quantityInitialize: id() } }
  );
  if (existing.data.gqc_workspaces_v1[0]?.appListId === listId) {
    await restoreSavedItemLinks(listId, userId, existing.data);
    return;
  }
  if (existing.data.gqc_workspaces_v1.length)
    throw new Error('This list has an incompatible quantity history');
  const result = await db.queryOnce({
    grocery_lists: {
      $: { where: { id: listId } },
      grocery_items: { store: {}, saved_item: {} },
      meal_plan_items: { store: {} },
      meal_plan_recipes: {
        recipe: { recipe_ingredients: { store: {} } },
        ingredient_snapshots: { store: {} },
      },
    },
  });
  const list = result.data.grocery_lists[0];
  if (!list) throw new Error('Grocery list access is unavailable');
  const operation = buildLegacyQuantityOperation(list, id);
  try {
    await db.transact([
      db.tx.gqc_workspaces_v1[listId]
        .update({
          name: list.name,
          ownerId: userId,
          memberIds: [userId],
          appListId: listId,
        })
        .link({ groceryList: listId }),
      operationChunk(operation, listId, userId),
    ]);
  } catch (error) {
    // Another member may have won initialization; never retry a second genesis.
    const winner = await db.queryOnce({
      gqc_workspaces_v1: { $: { where: { id: listId } } },
    });
    if (!winner.data.gqc_workspaces_v1.length) throw error;
  }
}

/** Repair earlier development imports by original row ID, never by name. */
async function restoreSavedItemLinks(
  listId: string,
  userId: string,
  data: {
    gqc_operations_v1: { body: string }[];
    grocery_items: { id: string; saved_item?: { id: string } | null }[];
  }
) {
  const state = materialize(
    data.gqc_operations_v1.map(row => JSON.parse(row.body) as Operation)
  );
  const tx = new QuantityTransaction(state);
  let changed = false;
  for (const item of data.grocery_items) {
    const row = state.documents[item.id];
    if (item.saved_item && row?.kind === 'row' && !row.savedItemId) {
      tx.put({ ...row, savedItemId: item.saved_item.id });
      changed = true;
    }
  }
  if (changed)
    await commitOperations(
      quantityCommitStore(userId),
      [
        {
          workspaceId: listId,
          operation: tx.build(id(), 'Restore saved-item links'),
        },
      ],
      userId,
      true
    );
}
