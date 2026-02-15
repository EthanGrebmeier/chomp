import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';

import {
  Category,
  categoryOptions,
} from '@/features/shared/category/categories';

import { parseRecipeUrl, RecipeParseError } from '../api/parse-recipe-url';
import { IngredientCategory, ParseRecipeUrlResponse } from '../api/types';

// Temporary local mock to avoid hitting the parse API while building the flow.
const USE_MOCK_PARSE_RECIPE_RESPONSE = false;
const MOCK_PARSE_DELAY_MS = 500;

function getMockParseRecipeResponse(url: string): ParseRecipeUrlResponse {
  return {
    sourceUrl: url,
    recipeName: 'Autofilled Creamy Garlic Chicken Pasta',
    servings: '4',
    ingredients: [
      {
        name: 'Boneless chicken breast',
        quantity: 1.5,
        unit: 'lb',
        notes: 'cut into bite-size pieces',
        category: 'deli',
      },
      {
        name: 'Penne pasta',
        quantity: 12,
        unit: 'oz',
        notes: null,
        category: 'pantry',
      },
      {
        name: 'Heavy cream',
        quantity: 1,
        unit: 'cup',
        notes: null,
        category: 'dairy',
      },
      {
        name: 'Parmesan cheese',
        quantity: 0.5,
        unit: 'cup',
        notes: 'freshly grated',
        category: 'dairy',
      },
      {
        name: 'Baby spinach',
        quantity: 4,
        unit: 'cup',
        notes: 'packed',
        category: 'produce',
      },
      {
        name: 'Garlic cloves',
        quantity: 4,
        unit: null,
        notes: 'minced',
        category: 'produce',
      },
      {
        name: 'Olive oil',
        quantity: 2,
        unit: 'tbsp',
        notes: null,
        category: 'pantry',
      },
      {
        name: 'Kosher salt',
        quantity: 1,
        unit: 'tsp',
        notes: 'or to taste',
        category: 'pantry',
      },
      {
        name: 'Black pepper',
        quantity: 0.5,
        unit: 'tsp',
        notes: 'freshly cracked',
        category: 'pantry',
      },
    ],
  };
}

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
        if (USE_MOCK_PARSE_RECIPE_RESPONSE) {
          await new Promise(resolve =>
            setTimeout(resolve, MOCK_PARSE_DELAY_MS)
          );
          return normalizeResponse(getMockParseRecipeResponse(url));
        }

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
