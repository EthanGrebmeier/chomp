import { ParsedIngredient, ParseRecipeUrlResponse } from '../api/types';
import { CreateRecipeArgs } from '../instant/create-recipe';

/**
 * Transforms parsed recipe API response into CreateRecipeArgs format
 * for creating a new recipe in the database.
 */
export const transformParsedRecipe = (
  data: ParseRecipeUrlResponse,
  editedName: string,
  selectedIngredients: ParsedIngredient[]
): CreateRecipeArgs => {
  return {
    recipe: {
      name: editedName || data.recipeName || 'Imported Recipe',
      description: '',
      sourceUrl: data.sourceUrl,
      servings: data.servings ?? undefined,
    },
    ingredients: selectedIngredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity ?? 1,
      unit: ing.unit ?? '',
      notes: ing.notes ?? undefined,
      category: ing.category,
    })),
  };
};
