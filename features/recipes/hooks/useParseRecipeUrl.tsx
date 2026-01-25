import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';

import {
  Category,
  categoryOptions,
} from '@/features/shared/category/categories';

import { parseRecipeUrl, RecipeParseError } from '../api/parse-recipe-url';
import { IngredientCategory, ParseRecipeUrlResponse } from '../api/types';

/**
 * Normalize a category value to match the expected lowercase format.
 * Returns the matching category value or 'other' as fallback.
 */
function normalizeCategory(category: string): IngredientCategory {
  const lowerCategory = category.toLowerCase();
  const match = categoryOptions.find(opt => opt.value === lowerCategory);
  return (match?.value ?? 'other') as Category;
}

/**
 * Normalize all ingredient categories in the API response.
 */
function normalizeResponse(
  response: ParseRecipeUrlResponse
): ParseRecipeUrlResponse {
  return {
    ...response,
    ingredients: response.ingredients.map(ingredient => ({
      ...ingredient,
      category: normalizeCategory(ingredient.category),
    })),
  };
}

export const useParseRecipeUrl = () => {
  const { getToken } = useAuth();

  return useMutation<ParseRecipeUrlResponse, RecipeParseError, { url: string }>(
    {
      mutationFn: async ({ url }) => {
        const token = await getToken();
        if (!token) {
          throw new RecipeParseError('unauthorized', 'Not authenticated');
        }
        const response = await parseRecipeUrl({ url }, token);
        return normalizeResponse(response);
      },
    }
  );
};
