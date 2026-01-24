import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';

import { parseRecipeUrl, RecipeParseError } from '../api/parse-recipe-url';
import { ParseRecipeUrlResponse } from '../api/types';

export const useParseRecipeUrl = () => {
  const { getToken } = useAuth();

  return useMutation<ParseRecipeUrlResponse, RecipeParseError, { url: string }>(
    {
      mutationFn: async ({ url }) => {
        const token = await getToken();
        if (!token) {
          throw new RecipeParseError('unauthorized', 'Not authenticated');
        }
        return parseRecipeUrl({ url }, token);
      },
    }
  );
};
