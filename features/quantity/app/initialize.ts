import { id } from '@instantdb/react-native';

import { db } from '@/lib/instant';

import { materialize, normalize } from '../model';
import { operationChunk } from '../sync-workspace';
import { QuantityTransaction } from '../transaction';
import type { Ingredient, Meal, Operation, Recipe } from '../types';

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
    },
    { ruleParams: { quantityInitialize: id() } }
  );
  if (existing.data.gqc_workspaces_v1[0]?.appListId === listId) {
    await restoreSavedItemLinks(listId, userId);
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
  const tx = new QuantityTransaction(materialize([]));
  tx.put({ kind: 'list', id: listId, name: list.name });
  // Preserve every original amount without inventing its allocation. Legacy
  // records remain untouched as a backup; the new app never writes them.
  for (const item of list.grocery_items) {
    const ingredient = ingredientFromApp(item);
    tx.put({
      kind: 'row',
      id: item.id,
      listId,
      name: item.name,
      unit: normalize(item.unit),
      notes: ingredient.notes,
      category: ingredient.category,
      store: ingredient.store,
      status: item.isDeleted
        ? 'deleted'
        : item.isChecked
          ? 'checked'
          : 'active',
      createdAt: item.createdAt,
      ...(item.saved_item ? { savedItemId: item.saved_item.id } : {}),
    });
    tx.put({
      kind: 'entry',
      id: id(),
      rowId: item.id,
      quantity: item.quantity,
      unit: normalize(item.unit),
      sourceUnit: item.unit,
      origin: 'manual',
      sourceName: '',
      sourceNotes: '',
      sourceDate: '',
      mealTag: '',
      sourceId: null,
      mealId: null,
    });
  }
  // Existing plans are retained, initially off the shopping list: their scalar
  // quantities above already account for the old shopping cycle.
  for (const item of list.meal_plan_items) {
    tx.put({
      kind: 'meal',
      id: item.id,
      listId,
      name: item.name,
      recipeId: null,
      date: item.date,
      mealTag: item.mealTag ?? '',
      servings: 1,
      ingredients: [
        {
          ...ingredientFromApp(item),
          id: id(),
          recipeIngredientId: null,
          selected: false,
          overridden: false,
        },
      ],
    });
  }
  for (const item of list.meal_plan_recipes) {
    if (!item.recipe) continue;
    const recipe = recipeFromApp(item.recipe);
    tx.put(recipe);
    const ingredients: Meal['ingredients'] = item.ingredient_snapshots.length
      ? item.ingredient_snapshots.map(i => ({
          ...ingredientFromApp(i),
          quantity: i.isQuantityOverridden
            ? i.quantity
            : i.quantity * item.servings,
          recipeIngredientId: i.sourceRecipeIngredientId,
          selected: false,
          overridden: i.isQuantityOverridden,
        }))
      : recipe.ingredients.map(i => ({
          ...i,
          id: id(),
          recipeIngredientId: i.id,
          quantity: i.quantity * item.servings,
          selected: false,
          overridden: false,
        }));
    tx.put({
      kind: 'meal',
      id: item.id,
      listId,
      name: recipe.name,
      recipeId: recipe.id,
      date: item.date,
      mealTag: item.mealTag ?? '',
      servings: item.servings,
      ingredients,
    });
  }
  const operation = tx.build(id(), 'Initialize list quantities');
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
async function restoreSavedItemLinks(listId: string, userId: string) {
  const { data } = await db.queryOnce({
    gqc_operations_v1: { $: { where: { workspaceId: listId } } },
    grocery_items: {
      $: { where: { 'grocery_list.id': listId } },
      saved_item: {},
    },
  });
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
    await db.transact(
      operationChunk(tx.build(id(), 'Restore saved-item links'), listId, userId)
    );
}
