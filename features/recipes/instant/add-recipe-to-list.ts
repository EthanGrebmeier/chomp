import type { StoreReviewer } from '@/features/quantity/app/store-review';

import {
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
  reviewConflicts?: StoreReviewer;
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
  reviewConflicts,
  conflictResolution = 'prompt',
}: AddRecipeToListArgs) => {
  const { addQuantityRecipe } =
    await import('@/features/quantity/app/recipe-actions');
  return addQuantityRecipe({
    recipeId,
    listId,
    ingredients,
    defaultStore,
    reviewConflicts,
    conflictResolution,
  });
};
