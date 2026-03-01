import {
  addIngredientsWithStacking,
  ConflictResolution,
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
  conflictResolution?: ConflictResolution;
};

export const addRecipeToList = async ({
  recipeId,
  listId,
  ingredients,
  conflictResolution = 'prompt',
}: AddRecipeToListArgs) => {
  const result = await addIngredientsWithStacking({
    listId,
    conflictResolution,
    ingredients: ingredients.map(ingredient => ({
      ...ingredient,
      recipeId,
    })),
  });

  return {
    ...result,
    addedItems: result.createdCount + result.stackedCount,
  };
};
