import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';
import { Recipe } from '../recipes/types';
import { Store } from '../stores/types';

export type MealPlanRecipe = InstaQLEntity<typeof schema, 'meal_plan_recipes'>;
export type MealPlanItem = InstaQLEntity<typeof schema, 'meal_plan_items'>;

export type MealPlanItemWithStore = MealPlanItem & {
  store?: Store;
};

export type MealTag =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snack'
  | 'Dessert'
  | 'None';

export type MealPlanRecipeWithRecipe = MealPlanRecipe & {
  recipe: Recipe;
};

export type AddRecipeToDateArgs = {
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

export type AddMealsToGroceryListArgs = {
  listId: string;
};

export type AddItemToDateArgs = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  category?: string;
  storeId?: string;
  date: string;
  mealTag?: string;
};

export type UpdateMealPlanItemArgs = {
  mealPlanItemId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: string;
    notes?: string;
    category?: string;
    storeId?: string;
    date?: string;
    mealTag?: string;
  };
};

export type RemoveItemFromMealPlanArgs = {
  mealPlanItemId: string;
};
