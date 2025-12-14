import { InstaQLEntity } from '@instantdb/react-native';

import schema from '../../instant.schema';

export type Recipe = InstaQLEntity<typeof schema, 'recipes'>;
export type RecipeIngredient = InstaQLEntity<
  typeof schema,
  'recipe_ingredients'
>;
export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
};

export type CreateRecipeArgs = {
  recipe: {
    name: string;
    description?: string;
    imageSrc?: string;
    visibility?: string;
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
