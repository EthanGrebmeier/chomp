import { recipeIngredientTable, recipeTable } from '../../db/schema';
import { Item, QuantityUnit } from '../shared/types';

export type Recipe = typeof recipeTable.$inferSelect;
export type RecipeInsert = typeof recipeTable.$inferInsert;

export type RecipeIngredient = typeof recipeIngredientTable.$inferSelect;
export type RecipeIngredientInsert = typeof recipeIngredientTable.$inferInsert;

export type RecipeIngredientWithItem = RecipeIngredient & {
  item: Item;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredientWithItem[];
};

export type CreateRecipeArgs = {
  recipe: Omit<RecipeInsert, 'id' | 'createdAt'>;
  ingredients: {
    name: string;
    quantity: number;
    unit: QuantityUnit;
    notes?: string;
    order?: number;
  }[];
};

export type AddRecipeToListArgs = {
  recipeId: string;
  groceryListId: string;
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
