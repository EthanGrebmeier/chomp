import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';
import { Recipe } from '../recipes/types';
import { Store } from '../stores/types';

export type MealPlan = InstaQLEntity<typeof schema, 'meal_plans'>;
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

// Type for meal plan data as returned by InstantDB queries
export type MealPlanQueryResult = MealPlan & {
  meal_plan_recipes: (MealPlanRecipe & { recipe?: Recipe })[];
  meal_plan_items: MealPlanItem[];
};

export type MealPlanWithRecipes = MealPlan & {
  meal_plan_recipes: MealPlanRecipeWithRecipe[];
};

export type MealPlanWithRecipesAndItems = MealPlan & {
  meal_plan_recipes: MealPlanRecipeWithRecipe[];
  meal_plan_items: MealPlanItemWithStore[];
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

export type AddItemToMealPlanArgs = {
  mealPlanId: string;
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

export type MealPlanDay = {
  date: string;
  recipes: MealPlanRecipeWithRecipe[];
};
