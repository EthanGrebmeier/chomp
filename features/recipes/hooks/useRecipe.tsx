import { useQuery } from '@tanstack/react-query';
import { getRecipe } from '../db/get-recipe';
import { recipeQueryKeys } from '../query-keys';

export const useRecipe = (recipeId: string) => {
  return useQuery({
    queryKey: recipeQueryKeys.detail(recipeId),
    queryFn: () => getRecipe(recipeId),
    enabled: !!recipeId,
  });
};
