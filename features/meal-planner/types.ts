import { mealPlanRecipeTable, mealPlanTable } from '../../db/schema';
import { Recipe } from '../recipes/types';

export type MealPlan = typeof mealPlanTable.$inferSelect;
export type MealPlanInsert = typeof mealPlanTable.$inferInsert;

export type MealPlanRecipe = typeof mealPlanRecipeTable.$inferSelect;
export type MealPlanRecipeInsert = typeof mealPlanRecipeTable.$inferInsert;

export type MealTag = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

export type MealPlanWithRecipes = MealPlan & {
  recipes: (MealPlanRecipe & { recipe: Recipe })[];
  groceryList?: {
    id: string;
    name: string;
    date: string | null;
  };
};

export type CreateMealPlanArgs = {
  mealPlan: Omit<MealPlanInsert, 'id' | 'createdAt'>;
};

export type AddRecipeToMealPlanArgs = {
  mealPlanId: string;
  recipeId: string;
  date: string;
  mealTag?: MealTag;
  servings?: number;
};

export type UpdateMealPlanRecipeArgs = {
  mealPlanRecipeId: string;
  updates: {
    mealTag?: MealTag;
    servings?: number;
    order?: number;
    recipeId?: string;
    date?: string;
  };
};

export type RemoveRecipeFromMealPlanArgs = {
  mealPlanRecipeId: string;
};

export type GenerateGroceryListFromMealPlanArgs = {
  mealPlanId: string;
};

export type MealPlanDay = {
  date: string;
  recipes: (MealPlanRecipe & { recipe: Recipe })[];
};
