import { useAuth } from '@clerk/expo';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useCategoryOptions } from '@/features/categories/use-category-options';

import {
  isMockRecipeImportEnabled,
  mockParseRecipeUrl,
} from '../api/mock-parse-recipe-url';
import { parseRecipeUrl, RecipeParseError } from '../api/parse-recipe-url';
import { ParseRecipeUrlResponse } from '../api/types';
import {
  normalizeParsedRecipeCategories,
  toRecipeImportCategories,
} from '../utils/recipe-import-categories';

type ParseRecipeUrlVariables = {
  url: string;
  /** Lets the caller cancel an in-flight import. */
  signal?: AbortSignal;
};

export const useParseRecipeUrl = () => {
  const { getToken } = useAuth();
  // Offer the model exactly the categories the user can currently pick,
  // including custom ones and excluding hidden built-ins.
  const { data: categoryOptions } = useCategoryOptions();
  const categories = useMemo(
    () => toRecipeImportCategories(categoryOptions),
    [categoryOptions]
  );

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

      const response = await parse({ url, categories }, token, { signal });
      return normalizeParsedRecipeCategories(response, categories);
    },
  });
};
