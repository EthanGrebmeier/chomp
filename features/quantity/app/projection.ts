import type { GroceryListItemWithRecipe } from '@/features/grocery-list/types';
import type {
  MealPlanItemWithStore,
  MealPlanRecipeWithRecipe,
} from '@/features/meal-planner/types';
import type { RecipeWithIngredients } from '@/features/recipes/types';
import type { Store } from '@/features/stores/types';

import { records } from '../model';
import type { Meal, QuantityEntry, QuantityState, Versioned } from '../types';

const epoch = '1970-01-01T00:00:00.000Z';
function projectionIndex(state: QuantityState, stores: Store[]) {
  const entriesByRow = new Map<string, Versioned<QuantityEntry>[]>();
  const entriesBySource = new Map<string, Versioned<QuantityEntry>>();
  for (const entry of records(state, 'entry')) {
    const entries = entriesByRow.get(entry.rowId) ?? [];
    entries.push(entry);
    entriesByRow.set(entry.rowId, entries);
    if (entry.sourceId && !entriesBySource.has(entry.sourceId))
      entriesBySource.set(entry.sourceId, entry);
  }
  const storesById = new Map(stores.map(store => [store.id, store]));
  const totals = new Map(
    [...entriesByRow].map(([rowId, entries]) => [
      rowId,
      state.complete
        ? Math.round(
            entries.reduce((sum, entry) => sum + entry.quantity, 0) * 1e6
          ) / 1e6
        : 0,
    ])
  );
  const rows = records(state, 'row')
    .filter(row => row.status !== 'deleted' && entriesByRow.has(row.id))
    .map(row => ({
      id: row.id,
      name: row.name,
      unit: row.unit,
      quantity: totals.get(row.id) ?? 0,
      notes: row.notes,
      category: row.category || undefined,
      isChecked: row.status === 'checked',
      isDeleted: false,
      createdAt: row.createdAt ?? epoch,
      updatedAt: row.createdAt ?? epoch,
      store: storesById.get(row.store),
      quantityEntries: entriesByRow.get(row.id) ?? [],
    }));
  return {
    rows,
    rowsById: new Map(rows.map(row => [row.id, row])),
    entriesBySource,
    storesById,
    totals,
  };
}

export function groceryProjection(
  state: QuantityState,
  stores: Store[] = []
): GroceryListItemWithRecipe[] {
  return projectionIndex(state, stores).rows;
}
export function snapshotProjection(
  meal: Meal,
  state: QuantityState,
  stores: Store[] = []
) {
  return projectSnapshots(meal, state, projectionIndex(state, stores));
}

function projectSnapshots(
  meal: Meal,
  state: QuantityState,
  index: ReturnType<typeof projectionIndex>
) {
  return meal.ingredients.map(i => {
    const entry = index.entriesBySource.get(i.id);
    const document = entry ? state.documents[entry.rowId] : undefined;
    const sourceRow = document?.kind === 'row' ? document : undefined;
    const groceryItem = entry ? index.rowsById.get(entry.rowId) : undefined;
    return {
      id: i.id,
      sourceRecipeIngredientId: i.recipeIngredientId ?? i.id,
      name: i.name,
      quantity: i.overridden ? i.quantity : i.quantity / meal.servings,
      unit: i.unit,
      notes: i.notes,
      category: i.category,
      isSelected: i.selected,
      isQuantityOverridden: i.overridden,
      store: index.storesById.get(i.store),
      grocery_item:
        groceryItem ??
        (sourceRow
          ? {
              id: sourceRow.id,
              name: sourceRow.name,
              unit: sourceRow.unit,
              quantity: index.totals.get(sourceRow.id) ?? 0,
              isChecked: sourceRow.status === 'checked',
              isDeleted: sourceRow.status === 'deleted',
              createdAt: sourceRow.createdAt ?? epoch,
              updatedAt: epoch,
            }
          : null),
    };
  });
}
export function mealProjection(
  state: QuantityState,
  stores: Store[] = [],
  sourceRecipes: RecipeWithIngredients[] = []
) {
  const index = projectionIndex(state, stores);
  const recipes: MealPlanRecipeWithRecipe[] = [];
  const items: MealPlanItemWithStore[] = [];
  for (const meal of records(state, 'meal')) {
    const snapshots = projectSnapshots(meal, state, index);
    const common = {
      id: meal.id,
      date: meal.date,
      mealTag: meal.mealTag,
      createdAt: epoch,
      updatedAt: epoch,
      ignoredByGroceryList: !meal.ingredients.some(i => i.selected),
    };
    if (meal.recipeId) {
      const recipe = state.documents[meal.recipeId];
      if (recipe?.kind !== 'recipe') continue;
      recipes.push({
        ...common,
        servings: meal.servings,
        ingredient_snapshots: snapshots,
        recipe: {
          ...(sourceRecipes.find(r => r.id === recipe.id) ?? {
            id: recipe.id,
            name: recipe.name,
            description: '',
            imageSrc: '',
            visibility: 'private',
            createdAt: epoch,
            updatedAt: epoch,
            recipe_ingredients: recipe.ingredients.map(i => ({
              ...i,
              store: index.storesById.get(i.store),
            })),
          }),
          user: sourceRecipes.find(r => r.id === recipe.id)?.user ?? undefined,
        },
      });
    } else {
      const ingredient = meal.ingredients[0];
      if (!ingredient) continue;
      items.push({
        ...common,
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        notes: ingredient.notes,
        category: ingredient.category,
        store: index.storesById.get(ingredient.store),
        grocery_item: snapshots[0]?.grocery_item,
      });
    }
  }
  return { recipes, items };
}

type CachedGroceryRow = {
  version: string;
  entryVersions: string;
  complete: boolean;
  item: GroceryListItemWithRecipe;
};

/** Keep unchanged rows memoized when replay recreates the workspace documents. */
export function createGroceryProjector() {
  let previous = new Map<string, CachedGroceryRow>();
  return (state: QuantityState, stores: Store[] = []) => {
    const next = new Map<string, CachedGroceryRow>();
    const items = projectionIndex(state, stores).rows.map(item => {
      const version = state.documents[item.id].version;
      const entryVersions = JSON.stringify(
        item.quantityEntries?.map(entry => [entry.id, entry.version])
      );
      const cached = previous.get(item.id);
      const entry =
        cached?.version === version &&
        cached.entryVersions === entryVersions &&
        cached.complete === state.complete &&
        cached.item.store === item.store
          ? cached
          : { version, entryVersions, complete: state.complete, item };
      next.set(item.id, entry);
      return entry.item;
    });
    previous = next;
    return items;
  };
}
