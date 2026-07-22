import { db } from '../../../lib/instant';

import {
  addIngredientsWithStacking,
  ConflictResolution,
  DefaultStoreForStacking,
} from './stack-recipe-ingredients';

export type RecipeIngredientInput = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeName?: string | null;
  storeId?: string;
};

export type AddRecipeToListArgs = {
  recipeId: string;
  listId: string;
  // Pass ingredients directly to avoid queryOnce which doesn't work offline
  ingredients: RecipeIngredientInput[];
  defaultStore?: DefaultStoreForStacking | null;
  conflictResolution?: ConflictResolution;
};

export const addRecipeToList = async ({
  recipeId,
  listId,
  ingredients,
  defaultStore,
  conflictResolution = 'prompt',
}: AddRecipeToListArgs) => {
  const result = await addIngredientsWithStacking({
    listId,
    conflictResolution,
    defaultStore,
    ingredients: ingredients.map(ingredient => ({
      ...ingredient,
      recipeId,
    })),
  });

  if (
    !result.requiresConflictResolution &&
    result.createdCount + result.stackedCount > 0
  ) {
    await db.transact([
      db.tx.recipes[recipeId].update({
        lastAddedToListAt: new Date().toISOString(),
      }),
    ]);
  }

  return {
    ...result,
    addedItems: result.createdCount + result.stackedCount,
  };
};
