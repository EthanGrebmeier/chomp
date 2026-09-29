import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';
import { RecipeWithIngredients } from '../recipes/types';
import { Store } from '../stores/types';
import { MealPlanIngredientSnapshotCreateInput } from './meal-plan-recipe-ingredient-editor';

export type MealPlanRecipe = InstaQLEntity<typeof schema, 'meal_plan_recipes'>;
export type MealPlanItem = InstaQLEntity<typeof schema, 'meal_plan_items'>;
export type MealPlanRecipeIngredientSnapshot = InstaQLEntity<
  typeof schema,
  'meal_plan_recipe_ingredient_snapshots'
>;

/**
 * Grocery item linked one-to-one to a meal plan source (a recipe ingredient
 * snapshot or a standalone meal plan item).
 */
export type MealPlanLinkedGroceryItem = InstaQLEntity<
  typeof schema,
  'grocery_items'
>;

export type MealPlanItemWithStore = MealPlanItem & {
  store?: Store;
  grocery_item?: MealPlanLinkedGroceryItem | null;
};

export type MealTag =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snack'
  | 'Dessert'
  | 'None';

export type MealPlanRecipeIngredientSnapshotWithStore =
  MealPlanRecipeIngredientSnapshot & {
    store?: Store;
    grocery_item?: MealPlanLinkedGroceryItem | null;
  };

export type MealPlanRecipeWithRecipe = MealPlanRecipe & {
  recipe: RecipeWithIngredients & { user?: { id: string } };
  ingredient_snapshots?: MealPlanRecipeIngredientSnapshotWithStore[];
};

export type MealPlanViewMode = 'calendar' | 'day-list';

export type AddRecipeToDateArgs = {
  listId: string;
  recipeId: string;
  date: string;
  mealTag?: MealTag;
  servings?: number;
  ingredientSnapshots?: MealPlanIngredientSnapshotCreateInput[];
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

export type AddItemToDateArgs = {
  listId: string;
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
