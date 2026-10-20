import type { GroceryListItemWithRecipe } from '@/features/grocery-list/types';
import type {
  MealPlanItemWithStore,
  MealPlanRecipeWithRecipe,
} from '@/features/meal-planner/types';
import type { RecipeWithIngredients } from '@/features/recipes/types';
import type { Store } from '@/features/stores/types';

import { entriesFor, records, totalFor } from '../model';
import type { Meal, QuantityState } from '../types';

const epoch = '1970-01-01T00:00:00.000Z';
export function groceryProjection(
  state: QuantityState,
  stores: Store[] = []
): GroceryListItemWithRecipe[] {
  return records(state, 'row')
    .filter(row => row.status !== 'deleted')
    .map(row => ({
      id: row.id,
      name: row.name,
      unit: row.unit,
      quantity: totalFor(state, row.id) ?? 0,
      notes: row.notes,
      category: row.category || undefined,
      isChecked: row.status === 'checked',
      isDeleted: false,
      createdAt: row.createdAt ?? epoch,
      updatedAt: row.createdAt ?? epoch,
      store: stores.find(store => store.id === row.store),
      quantityEntries: entriesFor(state, row.id),
    }));
}
export function snapshotProjection(
  meal: Meal,
  state: QuantityState,
  stores: Store[] = []
) {
  const rows = groceryProjection(state, stores);
  return meal.ingredients.map(i => {
    const entry = records(state, 'entry').find(e => e.sourceId === i.id);
    const sourceRow = entry
      ? records(state, 'row').find(r => r.id === entry.rowId)
      : undefined;
    const groceryItem = entry
      ? rows.find(row => row.id === entry.rowId)
      : undefined;
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
      store: stores.find(s => s.id === i.store),
      grocery_item:
        groceryItem ??
        (sourceRow
          ? {
              id: sourceRow.id,
              name: sourceRow.name,
              unit: sourceRow.unit,
              quantity: totalFor(state, sourceRow.id) ?? 0,
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
  const recipes: MealPlanRecipeWithRecipe[] = [];
  const items: MealPlanItemWithStore[] = [];
  for (const meal of records(state, 'meal')) {
    const snapshots = snapshotProjection(meal, state, stores);
    const common = {
      id: meal.id,
      date: meal.date,
      mealTag: meal.mealTag,
      createdAt: epoch,
      updatedAt: epoch,
      ignoredByGroceryList: !meal.ingredients.some(i => i.selected),
    };
    if (meal.recipeId) {
      const recipe = records(state, 'recipe').find(r => r.id === meal.recipeId);
      if (!recipe) continue;
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
              store: stores.find(s => s.id === i.store),
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
        store: stores.find(s => s.id === ingredient.store),
        grocery_item: snapshots[0]?.grocery_item,
      });
    }
  }
  return { recipes, items };
}
