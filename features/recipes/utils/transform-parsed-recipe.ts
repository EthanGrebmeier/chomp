import { ParsedIngredient, ParseRecipeUrlResponse } from '../api/types';
import { CreateRecipeArgs } from '../instant/create-recipe';

/**
 * Transforms parsed recipe API response into CreateRecipeArgs format
 * for creating a new recipe in the database.
 */
export const transformParsedRecipe = (
  data: ParseRecipeUrlResponse,
  editedName: string,
  selectedIngredients: ParsedIngredient[],
  /** User-edited source URL; falls back to the URL that was parsed. */
  sourceUrl?: string
): CreateRecipeArgs => {
  return {
    recipe: {
      name: editedName || data.recipeName || 'Imported Recipe',
      description: '',
      sourceUrl: sourceUrl?.trim() || data.sourceUrl,
      servings: data.servings ?? undefined,
    },
    ingredients: selectedIngredients.map(ing => ({
      name: ing.name,
      quantity: ing.quantity ?? 1,
      unit: ing.unit ?? '',
      notes: ing.notes ?? undefined,
      category: ing.category,
    })),
  };
};
