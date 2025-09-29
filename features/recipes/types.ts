import { recipeIngredientTable, recipeTable } from '../../db/schema';

export type Recipe = typeof recipeTable.$inferSelect;
export type RecipeInsert = typeof recipeTable.$inferInsert;

export type RecipeIngredient = typeof recipeIngredientTable.$inferSelect;
export type RecipeIngredientInsert = typeof recipeIngredientTable.$inferInsert;

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[];
};

export type CreateRecipeArgs = {
  recipe: Omit<RecipeInsert, 'id' | 'createdAt'>;
  ingredients: Omit<RecipeIngredientInsert, 'id' | 'recipeId'>[];
};

export type AddRecipeToListArgs = {
  recipeId: string;
  groceryListId: string;
};

export type UpdateRecipeArgs = {
  recipeId: string;
  updates: {
    name?: string;
    description?: string;
    servings?: number;
  };
};
