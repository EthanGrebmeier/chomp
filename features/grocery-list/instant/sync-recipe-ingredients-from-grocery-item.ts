import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

const normalizeForMatch = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

type RecipeIngredientSyncPatch = {
  name?: string;
  category?: string;
  notes?: string;
  storeId?: string;
};

export type SyncRecipeIngredientsFromGroceryItemArgs = {
  recipeId?: string;
  matchName?: string;
  matchUnit?: string;
  patch: RecipeIngredientSyncPatch;
};

export const syncRecipeIngredientsFromGroceryItem = async ({
  recipeId,
  matchName,
  matchUnit,
  patch,
}: SyncRecipeIngredientsFromGroceryItemArgs) => {
  if (!recipeId) {
    return;
  }

  const normalizedName = normalizeForMatch(matchName);
  const normalizedUnit = normalizeForMatch(matchUnit);
  if (!normalizedName || !normalizedUnit) {
    return;
  }

  const queryResult = await db.queryOnce({
    recipe_ingredients: {
      recipe: {},
      store: {},
    },
  });

  const matchingIngredients = queryResult.data.recipe_ingredients.filter(
    ingredient =>
      ingredient.recipe?.id === recipeId &&
      normalizeForMatch(ingredient.name) === normalizedName &&
      normalizeForMatch(ingredient.unit) === normalizedUnit
  );

  if (matchingIngredients.length === 0) {
    return;
  }

  const transactions = [];
  for (const ingredient of matchingIngredients) {
    const updatePatch: Record<string, string | null | undefined> = {};
    if ('name' in patch) {
      updatePatch.name = patch.name;
    }
    if ('category' in patch) {
      updatePatch.category = patch.category ?? null;
    }
    if ('notes' in patch) {
      updatePatch.notes = patch.notes ?? null;
    }

    if (Object.keys(updatePatch).length > 0) {
      transactions.push(
        db.tx.recipe_ingredients[ingredient.id].update(trimStringFields(updatePatch))
      );
    }

    if ('storeId' in patch) {
      const currentStoreId = ingredient.store?.id;
      if (!patch.storeId && currentStoreId) {
        transactions.push(
          db.tx.recipe_ingredients[ingredient.id].unlink({
            store: currentStoreId,
          })
        );
      } else if (patch.storeId && patch.storeId !== currentStoreId) {
        if (currentStoreId) {
          transactions.push(
            db.tx.recipe_ingredients[ingredient.id].unlink({
              store: currentStoreId,
            })
          );
        }
        transactions.push(
          db.tx.recipe_ingredients[ingredient.id].link({
            store: patch.storeId,
          })
        );
      }
    }
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }
};
