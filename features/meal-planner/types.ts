import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';
import { RecipeWithIngredients } from '../recipes/types';
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
  recipe: RecipeWithIngredients;
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
  /** Recipe IDs to actually add ingredients for. If omitted, all unadded recipes are added. */
  selectedRecipeIds?: string[];
  /** Recipe IDs to mark as added without creating grocery items. */
  skippedRecipeIds?: string[];
  /** Item IDs to actually add. If omitted, all unadded items are added. */
  selectedItemIds?: string[];
  /** Item IDs to mark as added without creating grocery items. */
  skippedItemIds?: string[];
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
