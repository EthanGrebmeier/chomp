import { materialize, normalize } from '../model';
import { QuantityTransaction } from '../transaction';
import type { Ingredient, Meal, Operation, Recipe } from '../types';

type LegacyIngredient = {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string;
  store?: { id: string } | null;
};
type LegacyRecipe = {
  id: string;
  name: string;
  recipe_ingredients: LegacyIngredient[];
};
export type LegacyList = {
  id: string;
  name: string;
  grocery_items: (LegacyIngredient & {
    id: string;
    createdAt?: string;
    isDeleted?: boolean | null;
    isChecked?: boolean | null;
    saved_item?: { id: string } | null;
  })[];
  meal_plan_items: (LegacyIngredient & {
    id: string;
    date: string;
    mealTag?: string | null;
  })[];
  meal_plan_recipes: {
    id: string;
    date: string;
    mealTag?: string | null;
    servings: number;
    recipe?: LegacyRecipe | null;
    ingredient_snapshots: (LegacyIngredient & {
      id: string;
      isQuantityOverridden: boolean;
      sourceRecipeIngredientId: string;
    })[];
  }[];
};
export function ingredientFromLegacy(
  item: LegacyIngredient,
  newId: () => string
): Ingredient {
  return {
    id: item.id ?? newId(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes ?? '',
    category: item.category ?? '',
    store: item.storeId ?? item.store?.id ?? '',
  };
}
export function recipeFromLegacy(
  recipe: LegacyRecipe,
  newId: () => string
): Recipe {
  return {
    kind: 'recipe',
    id: recipe.id,
    name: recipe.name,
    ingredients: recipe.recipe_ingredients.map(item =>
      ingredientFromLegacy(item, newId)
    ),
  };
}
/** Initialize contribution history for an existing scalar list. */
export function buildLegacyQuantityOperation(
  list: LegacyList,
  newId: () => string
): Operation {
  const listId = list.id;
  const tx = new QuantityTransaction(materialize([]));
  tx.put({ kind: 'list', id: listId, name: list.name });
  // Preserve every original amount without inventing its allocation. Legacy
  // records remain untouched as a backup; the new app never writes them.
  for (const item of list.grocery_items) {
    const ingredient = ingredientFromLegacy(item, newId);
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
      ...(item.isChecked ? { purchasedAt: null } : {}),
      ...(item.saved_item ? { savedItemId: item.saved_item.id } : {}),
    });
    tx.put({
      kind: 'entry',
      id: newId(),
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
          ...ingredientFromLegacy(item, newId),
          id: newId(),
          recipeIngredientId: null,
          selected: false,
          overridden: false,
        },
      ],
    });
  }
  for (const item of list.meal_plan_recipes) {
    if (!item.recipe) continue;
    const recipe = recipeFromLegacy(item.recipe, newId);
    tx.put(recipe);
    const ingredients: Meal['ingredients'] = item.ingredient_snapshots.length
      ? item.ingredient_snapshots.map(i => ({
          ...ingredientFromLegacy(i, newId),
          quantity: i.isQuantityOverridden
            ? i.quantity
            : i.quantity * item.servings,
          recipeIngredientId: i.sourceRecipeIngredientId,
          selected: false,
          overridden: i.isQuantityOverridden,
        }))
      : recipe.ingredients.map(i => ({
          ...i,
          id: newId(),
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
  return {
    ...tx.build(newId(), 'Initialize list quantities'),
    commit: { sequence: 1, parents: [] },
  };
}
