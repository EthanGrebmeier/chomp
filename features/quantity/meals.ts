import { normalize, record, records, validQuantity } from './model';
import { addEntryToRow, type Destination, type NewId } from './shopping';
import { QuantityTransaction } from './transaction';
import type {
  Ingredient,
  Meal,
  PlannedIngredient,
  QuantityState,
  Recipe,
} from './types';

export function saveRecipe(state: QuantityState, newId: NewId, recipe: Recipe) {
  const existing = state.documents[recipe.id];
  if (existing?.kind === 'recipe' && existing.deleted)
    throw new Error('This recipe has been deleted');
  const tx = new QuantityTransaction(state);
  tx.put(recipe);
  // Scheduled snapshots track unoverridden recipe quantities; direct adds never do.
  for (const meal of records(state, 'meal').filter(
    m => m.recipeId === recipe.id
  )) {
    const updated = {
      ...meal,
      name: recipe.name,
      ingredients: meal.ingredients
        .map(ingredient => {
          const source = recipe.ingredients.find(
            i => i.id === ingredient.recipeIngredientId
          );
          return source
            ? {
                ...ingredient,
                name: source.name,
                unit: ingredient.overridden ? ingredient.unit : source.unit,
                category: source.category,
                store: source.store,
                ...(ingredient.overridden
                  ? {}
                  : { quantity: source.quantity * meal.servings }),
                notes: source.notes,
              }
            : { ...ingredient, selected: false };
        })
        .concat(
          recipe.ingredients
            .filter(
              source =>
                !meal.ingredients.some(i => i.recipeIngredientId === source.id)
            )
            .map(source => ({
              ...source,
              id: newId(),
              recipeIngredientId: source.id,
              quantity: source.quantity * meal.servings,
              selected: meal.ingredients.some(i => i.selected),
              overridden: false,
            }))
        ),
    };
    tx.put(updated);
    syncMeal(tx, newId, updated);
  }
  return tx.build(newId(), `Save recipe ${recipe.name}`);
}

export function addRecipe(
  state: QuantityState,
  newId: NewId,
  recipeId: string,
  listId: string,
  destinations: Record<string, Destination> = {}
) {
  const tx = new QuantityTransaction(state);
  const recipe = record(state, recipeId, 'recipe');
  tx.require(recipe);
  for (const item of recipe.ingredients)
    addEntryToRow(
      tx,
      newId,
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
      destinations[item.id]
    );
  return tx.build(newId(), `Add ${recipe.name} from recipe`);
}

export function scheduleMeal(
  state: QuantityState,
  newId: NewId,
  meal: Omit<Meal, 'kind' | 'id' | 'ingredients'>,
  ingredients: Ingredient[],
  destinations: Record<string, Destination> = {}
) {
  const tx = new QuantityTransaction(state);
  if (meal.recipeId) tx.require(record(state, meal.recipeId, 'recipe'));
  const planned: Meal = {
    ...meal,
    kind: 'meal',
    id: newId(),
    ingredients: ingredients.map(i => ({
      ...i,
      id: newId(),
      recipeIngredientId: meal.recipeId ? i.id : null,
      quantity: i.quantity * meal.servings,
      selected: true,
      overridden: false,
    })),
  };
  tx.put(planned);
  syncMeal(
    tx,
    newId,
    planned,
    Object.fromEntries(
      planned.ingredients.map((i, index) => [
        i.id,
        destinations[ingredients[index].id] ?? {},
      ])
    )
  );
  return tx.build(newId(), `Plan ${meal.name} for ${meal.date}`);
}

/** Exact source-instance identity replaces the old source-to-row reconciler. */
export function syncMeal(
  tx: QuantityTransaction,
  newId: NewId,
  meal: Meal,
  destinations: Record<string, Destination> = {}
) {
  for (const ingredient of meal.ingredients) {
    const entries = records(tx.state, 'entry').filter(
      e => e.sourceId === ingredient.id
    );
    const active = entries.filter(
      e => record(tx.state, e.rowId, 'row').status === 'active'
    );
    for (const entry of active) {
      const row = record(tx.state, entry.rowId, 'row');
      tx.require(row);
      if (!ingredient.selected) tx.remove(entry.id);
      else {
        if (normalize(ingredient.unit) !== row.unit) {
          // A source changing units leaves other entries and shopping metadata
          // alone. Its contribution moves to a separate, compatible row.
          tx.remove(entry.id);
          addEntryToRow(tx, newId, meal.listId, ingredient, {
            quantity: ingredient.quantity,
            origin: entry.origin,
            sourceName: meal.name,
            sourceNotes: ingredient.notes,
            sourceDate: meal.date,
            mealTag: meal.mealTag,
            sourceId: ingredient.id,
            mealId: meal.id,
          });
          continue;
        }
        tx.put({
          ...entry,
          quantity: ingredient.quantity,
          sourceName: meal.name,
          sourceNotes: ingredient.notes,
          sourceDate: meal.date,
          mealTag: meal.mealTag,
        });
      }
    }
    // A history entry satisfies this source forever; changing it creates no delta.
    if (ingredient.selected && entries.length === 0)
      addEntryToRow(
        tx,
        newId,
        meal.listId,
        ingredient,
        {
          quantity: ingredient.quantity,
          origin: meal.recipeId ? 'scheduled' : 'planned',
          sourceName: meal.name,
          sourceNotes: ingredient.notes,
          sourceDate: meal.date,
          mealTag: meal.mealTag,
          sourceId: ingredient.id,
          mealId: meal.id,
        },
        destinations[ingredient.id]
      );
  }
}

export function editMealIngredient(
  state: QuantityState,
  newId: NewId,
  mealId: string,
  sourceId: string,
  patch: Partial<Pick<PlannedIngredient, 'quantity' | 'selected'>>,
  destination?: Destination
) {
  const tx = new QuantityTransaction(state);
  const meal = record(state, mealId, 'meal');
  if (patch.quantity !== undefined && !validQuantity(patch.quantity))
    throw new Error('Enter a valid quantity');
  if (!meal.ingredients.some(i => i.id === sourceId))
    throw new Error('Ingredient is no longer available');
  const updated = {
    ...meal,
    ingredients: meal.ingredients.map(i =>
      i.id === sourceId
        ? {
            ...i,
            ...patch,
            overridden: patch.quantity !== undefined ? true : i.overridden,
          }
        : i
    ),
  };
  tx.put(updated);
  syncMeal(tx, newId, updated, destination ? { [sourceId]: destination } : {});
  return tx.build(newId(), `Update ${meal.name} ingredient`);
}

export function editMealSchedule(
  state: QuantityState,
  newId: NewId,
  mealId: string,
  patch: Pick<Meal, 'date' | 'mealTag' | 'servings'>
) {
  const tx = new QuantityTransaction(state);
  const meal = record(state, mealId, 'meal');
  if (!validQuantity(patch.servings) || patch.servings === 0)
    throw new Error('Servings must be greater than zero');
  const updated = {
    ...meal,
    ...patch,
    ingredients: meal.ingredients.map(i => ({
      ...i,
      quantity: i.overridden
        ? i.quantity
        : (i.quantity * patch.servings) / meal.servings,
    })),
  };
  tx.put(updated);
  syncMeal(tx, newId, updated);
  return tx.build(newId(), `Update ${meal.name} schedule`);
}

export function removeMeal(state: QuantityState, newId: NewId, mealId: string) {
  const tx = new QuantityTransaction(state);
  const meal = record(state, mealId, 'meal');
  for (const entry of records(state, 'entry').filter(
    e => e.mealId === meal.id
  )) {
    const row = record(state, entry.rowId, 'row');
    tx.require(row);
    if (row.status === 'active') tx.remove(entry.id);
    else tx.put({ ...entry, sourceId: null, mealId: null });
  }
  tx.remove(meal.id);
  return tx.build(newId(), `Remove ${meal.name} from meal plan`);
}
