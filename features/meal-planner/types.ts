import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';
import { Recipe } from '../recipes/types';

export type MealPlan = InstaQLEntity<typeof schema, 'meal_plans'>;
export type MealPlanRecipe = InstaQLEntity<typeof schema, 'meal_plan_recipes'>;

export type MealTag = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert';

export type MealPlanRecipeWithRecipe = MealPlanRecipe & {
  recipe: Recipe;
};

export type MealPlanWithRecipes = MealPlan & {
  meal_plan_recipes: MealPlanRecipeWithRecipe[];
};

export type CreateMealPlanArgs = {
  mealPlan: {
    name: string;
    startDate: string;
    endDate: string;
  };
};

export type UpdateMealPlanArgs = {
  mealPlanId: string;
  updates: {
    name?: string;
    startDate?: string;
    endDate?: string;
    isArchived?: boolean;
  };
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

export type AddMealPlanToGroceryListArgs = {
  mealPlanId: string;
  listId: string;
};

export type MealPlanDay = {
  date: string;
  recipes: MealPlanRecipeWithRecipe[];
};
