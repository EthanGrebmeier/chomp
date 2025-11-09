import { recipeIngredientTable, recipeTable } from '../../db/schema';
import { QuantityUnit } from '../shared/types';

export type Recipe = typeof recipeTable.$inferSelect;
export type RecipeInsert = typeof recipeTable.$inferInsert;

export type RecipeIngredient = typeof recipeIngredientTable.$inferSelect;
export type RecipeIngredientInsert = typeof recipeIngredientTable.$inferInsert;

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[];
};

export type CreateRecipeArgs = {
  recipe: Omit<RecipeInsert, 'id' | 'createdAt' | 'updatedAt'>;
  ingredients: {
    name: string;
    quantity: number;
    unit: QuantityUnit;
    notes?: string;
    category?: string | null;
    order?: number;
  }[];
};

export type AddRecipeToListResult = {
  addedItems: number;
  isDuplicate?: boolean;
  existingItems?: any[];
};

export type UpdateRecipeArgs = {
  recipeId: string;
  updates: {
    name?: string;
    description?: string;
  };
};

export type RemoveRecipeIngredientArgs = {
  itemId: string;
  recipeId: string;
};
