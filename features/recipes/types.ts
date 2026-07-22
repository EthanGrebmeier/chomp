import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';
import { Store } from '../stores/types';

export type User = InstaQLEntity<typeof schema, '$users'>;

export type Recipe = InstaQLEntity<typeof schema, 'recipes'> & {
  user?: User | null;
};
export type RecipeIngredient = InstaQLEntity<
  typeof schema,
  'recipe_ingredients'
> & {
  store?: Store | null;
};
export type RecipeGroceryItem = InstaQLEntity<typeof schema, 'grocery_items'>;
export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
  grocery_items?: RecipeGroceryItem[];
};

export type CreateRecipeArgs = {
  recipe: {
    name: string;
    description?: string;
    imageSrc?: string;
    visibility?: string;
    mealTag?: string;
    sourceUrl?: string;
    servings?: string;
    sourceRecipeId?: string;
  };
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
    category?: string | null;
    order?: number;
  }[];
};

export type UpdateRecipeArgs = {
  recipeId: string;
  updates: {
    name?: string;
    description?: string;
    imageSrc?: string;
    visibility?: string;
  };
};

export type RemoveRecipeIngredientArgs = {
  ingredientId: string;
};
