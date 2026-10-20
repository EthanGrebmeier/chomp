import { id } from '@instantdb/react-native';

import type { AddItemToDateArgs } from '@/features/meal-planner/instant/add-item-to-meal-plan';
import type { AddRecipeToDateArgs } from '@/features/meal-planner/instant/add-recipe-to-meal-plan';
import type { UpdateSnapshotRowOverridesArgs } from '@/features/meal-planner/instant/meal-plan-ingredient-snapshot-store';
import type { UpdateMealPlanItemArgs } from '@/features/meal-planner/instant/update-meal-plan-item';
import type { UpdateMealPlanRecipeArgs } from '@/features/meal-planner/instant/update-meal-plan-recipe';
import { db } from '@/lib/instant';

import { syncMeal, removeMeal, editMealSchedule } from '../meals';
import { record, records } from '../model';
import { QuantityTransaction } from '../transaction';
import type { Meal, PlannedIngredient } from '../types';

import { ingredientFromApp, recipeFromApp } from './initialize';
import { snapshotProjection } from './projection';
import { changeDocument, documentSession, listSession } from './session';
import { chooseItemDestinations } from './store-review';

export async function planQuantityRecipe(args: AddRecipeToDateArgs) {
  listSession(args.listId);
  const result = await db.queryOnce({
    recipes: {
      $: { where: { id: args.recipeId } },
      recipe_ingredients: { store: {} },
    },
  });
  const source = result.data.recipes[0];
  if (!source) throw new Error('Recipe is no longer available');
  const recipe = recipeFromApp(source);
  const servings = args.servings ?? 1;
  const ingredients = (
    args.ingredientSnapshots ??
    args.sourceIngredients.map(i => ({
      ...i,
      sourceRecipeIngredientId: i.id,
      isSelected: true,
      isQuantityOverridden: false,
      storeId: i.store?.id,
    }))
  ).map(i => ({
    ...ingredientFromApp(i),
    id: id(),
    recipeIngredientId: i.sourceRecipeIngredientId,
    selected: i.isSelected,
    overridden: i.isQuantityOverridden,
    quantity: i.isQuantityOverridden ? i.quantity : i.quantity * servings,
    store: i.storeId ?? args.defaultStore?.id ?? '',
  }));
  const destinations = await chooseItemDestinations(
    args.listId,
    ingredients.filter(i => i.selected)
  );
  const session = listSession(args.listId);
  const meal: Meal = {
    kind: 'meal',
    id: id(),
    listId: args.listId,
    recipeId: recipe.id,
    name: recipe.name,
    date: args.date,
    mealTag: args.mealTag ?? '',
    servings,
    ingredients,
  };
  const tx = new QuantityTransaction(session.state);
  tx.put(recipe);
  tx.put(meal);
  syncMeal(tx, id, meal, destinations);
  await session.send(tx.build(id(), `Plan ${meal.name}`));
  return { id: meal.id };
}
export async function planQuantityItem(args: AddItemToDateArgs) {
  listSession(args.listId);
  const ingredient: PlannedIngredient = {
    ...ingredientFromApp(args),
    store: args.storeId ?? args.defaultStore?.id ?? '',
    selected: true,
    overridden: false,
    recipeIngredientId: null,
  };
  const destinations = await chooseItemDestinations(args.listId, [ingredient]);
  const session = listSession(args.listId);
  const meal: Meal = {
    kind: 'meal',
    id: id(),
    listId: args.listId,
    recipeId: null,
    name: args.name,
    date: args.date,
    mealTag: args.mealTag ?? '',
    servings: 1,
    ingredients: [ingredient],
  };
  const tx = new QuantityTransaction(session.state);
  tx.put(meal);
  syncMeal(tx, id, meal, destinations);
  await session.send(tx.build(id(), `Plan ${meal.name}`));
  return { id: meal.id };
}
export function updateQuantityItem({
  mealPlanItemId,
  updates,
}: UpdateMealPlanItemArgs) {
  return changeDocument(mealPlanItemId, state => {
    const tx = new QuantityTransaction(state);
    const meal = record(state, mealPlanItemId, 'meal');
    const old = meal.ingredients[0];
    const { date, mealTag, storeId, ...ingredientUpdates } = updates;
    const ingredient = {
      ...old,
      ...Object.fromEntries(
        Object.entries(ingredientUpdates).filter(([, v]) => v !== undefined)
      ),
      store: storeId ?? old.store,
    };
    const updated = {
      ...meal,
      name: updates.name ?? meal.name,
      date: date ?? meal.date,
      mealTag: mealTag ?? meal.mealTag,
      ingredients: [ingredient],
    };
    tx.put(updated);
    syncMeal(tx, id, updated);
    return tx.build(id(), `Edit ${updated.name}`);
  });
}
export async function updateQuantityMeal({
  mealPlanRecipeId,
  updates,
}: UpdateMealPlanRecipeArgs) {
  let session = documentSession(mealPlanRecipeId);
  const meal = record(session.state, mealPlanRecipeId, 'meal');
  if (updates.recipeId && updates.recipeId !== meal.recipeId) {
    const result = await db.queryOnce({
      recipes: {
        $: { where: { id: updates.recipeId } },
        recipe_ingredients: { store: {} },
      },
    });
    const source = result.data.recipes[0];
    if (!source) throw new Error('Replacement recipe is unavailable');
    const recipe = recipeFromApp(source);
    const servings = updates.servings ?? meal.servings;
    const replacement: Meal = {
      ...meal,
      name: recipe.name,
      recipeId: recipe.id,
      date: updates.date ?? meal.date,
      mealTag: updates.mealTag ?? meal.mealTag,
      servings,
      ingredients: recipe.ingredients.map(i => ({
        ...i,
        id: id(),
        recipeIngredientId: i.id,
        quantity: i.quantity * servings,
        overridden: false,
        selected: meal.ingredients.some(old => old.selected),
      })),
    };
    const choices = await chooseItemDestinations(
      session.listId,
      replacement.ingredients.filter(i => i.selected)
    );
    session = documentSession(mealPlanRecipeId);
    const tx = new QuantityTransaction(session.state);
    tx.require(meal);
    for (const entry of records(session.state, 'entry').filter(
      e => e.mealId === meal.id
    )) {
      const row = record(session.state, entry.rowId, 'row');
      tx.require(row);
      if (row.status === 'active') tx.remove(entry.id);
      else tx.put({ ...entry, sourceId: null, mealId: null });
    }
    tx.put(recipe);
    tx.put(replacement);
    syncMeal(tx, id, replacement, choices);
    await session.send(
      tx.build(id(), `Replace planned meal with ${recipe.name}`)
    );
    return;
  }
  await session.send(
    editMealSchedule(session.state, id, mealPlanRecipeId, {
      date: updates.date ?? meal.date,
      mealTag: updates.mealTag ?? meal.mealTag,
      servings: updates.servings ?? meal.servings,
    })
  );
}
export async function removeQuantityMeals(mealIds: string[]) {
  for (const mealId of mealIds) {
    await changeDocument(mealId, state => removeMeal(state, id, mealId));
  }
}
function mealForIngredient(snapshotRowId: string) {
  const session = documentSession(snapshotRowId);
  const meal = records(session.state, 'meal').find(m =>
    m.ingredients.some(i => i.id === snapshotRowId)
  );
  if (!meal) throw new Error('Planned ingredient is no longer available');
  return { session, meal };
}
export function quantitySnapshots(mealId: string) {
  const session = documentSession(mealId);
  const meal = record(session.state, mealId, 'meal');
  return snapshotProjection(meal, session.state).map((snapshot, index) => ({
    ...snapshot,
    // The editor only needs the identity; store labels come from its store query.
    store: meal.ingredients[index].store
      ? { id: meal.ingredients[index].store }
      : undefined,
  }));
}
export async function selectQuantityIngredients(
  mealId: string,
  selections: { snapshotRowId: string; isSelected: boolean }[]
) {
  let session = documentSession(mealId);
  const meal = record(session.state, mealId, 'meal');
  const updated = {
    ...meal,
    ingredients: meal.ingredients.map(i => ({
      ...i,
      selected:
        selections.find(s => s.snapshotRowId === i.id)?.isSelected ??
        i.selected,
    })),
  };
  const newlySelected = updated.ingredients.filter(
    i => i.selected && !meal.ingredients.find(old => old.id === i.id)?.selected
  );
  const choices = await chooseItemDestinations(session.listId, newlySelected);
  session = documentSession(mealId);
  const tx = new QuantityTransaction(session.state);
  tx.require(meal);
  tx.put(updated);
  syncMeal(tx, id, updated, choices);
  await session.send(tx.build(id(), `Select ingredients for ${meal.name}`));
}
export function selectQuantityIngredient(
  snapshotRowId: string,
  isSelected: boolean
) {
  const { meal } = mealForIngredient(snapshotRowId);
  return selectQuantityIngredients(meal.id, [{ snapshotRowId, isSelected }]);
}
export function setQuantityMealIgnored(mealId: string, ignored: boolean) {
  const session = documentSession(mealId);
  const meal = record(session.state, mealId, 'meal');
  return selectQuantityIngredients(
    mealId,
    meal.ingredients.map(i => ({ snapshotRowId: i.id, isSelected: !ignored }))
  );
}
export async function overrideQuantityIngredient({
  snapshotRowId,
  updates,
}: UpdateSnapshotRowOverridesArgs) {
  const { session, meal } = mealForIngredient(snapshotRowId);
  const tx = new QuantityTransaction(session.state);
  const updated = {
    ...meal,
    ingredients: meal.ingredients.map(i => {
      if (i.id !== snapshotRowId) return i;
      const source = meal.recipeId
        ? record(session.state, meal.recipeId, 'recipe').ingredients.find(
            s => s.id === i.recipeIngredientId
          )
        : undefined;
      const overridden =
        updates.isQuantityOverridden ??
        (updates.quantity !== undefined ? true : i.overridden);
      return {
        ...i,
        name: updates.name ?? i.name,
        unit: updates.unit ?? i.unit,
        notes: updates.notes === undefined ? i.notes : (updates.notes ?? ''),
        category:
          updates.category === undefined
            ? i.category
            : (updates.category ?? ''),
        store: updates.storeId ?? i.store,
        overridden,
        quantity: overridden
          ? (updates.quantity ?? i.quantity)
          : (updates.quantity ??
              source?.quantity ??
              i.quantity / meal.servings) * meal.servings,
      };
    }),
  };
  tx.put(updated);
  syncMeal(tx, id, updated);
  await session.send(tx.build(id(), `Edit ingredient in ${meal.name}`));
}
