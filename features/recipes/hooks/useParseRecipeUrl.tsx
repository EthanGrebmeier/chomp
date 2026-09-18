import { useAuth } from '@clerk/expo';
import { useMutation } from '@tanstack/react-query';

import { categoryOptions } from '@/features/shared/category/categories';

import {
  isMockRecipeImportEnabled,
  mockParseRecipeUrl,
} from '../api/mock-parse-recipe-url';
import { parseRecipeUrl, RecipeParseError } from '../api/parse-recipe-url';
import { IngredientCategory, ParseRecipeUrlResponse } from '../api/types';

/**
 * Normalize a category value to match the expected lowercase format.
 * Returns the matching category value or 'other' as fallback.
 */
function normalizeCategory(category: string): IngredientCategory {
  const lowerCategory = category.toLowerCase();
  const match = categoryOptions.find(opt => opt.value === lowerCategory);
  return match?.value ?? 'other';
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

type ParseRecipeUrlVariables = {
  url: string;
  /** Lets the caller cancel an in-flight import. */
  signal?: AbortSignal;
};

export const useParseRecipeUrl = () => {
  const { getToken } = useAuth();

  return useMutation<
    ParseRecipeUrlResponse,
    RecipeParseError,
    ParseRecipeUrlVariables
  >({
    mutationFn: async ({ url, signal }) => {
      const parse = isMockRecipeImportEnabled()
        ? mockParseRecipeUrl
        : parseRecipeUrl;

      // The mock doesn't need a token, but don't skip auth for the real API.
      const token = isMockRecipeImportEnabled() ? 'mock' : await getToken();
      if (!token) {
        throw new RecipeParseError('unauthorized', 'Not authenticated');
      }

      const response = await parse({ url }, token, { signal });
      return normalizeResponse(response);
    },
  });
};
