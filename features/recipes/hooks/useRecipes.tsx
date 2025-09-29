import { useQuery } from '@tanstack/react-query';
import { getRecipes } from '../db/get-recipes';
import { recipeQueryKeys } from '../query-keys';

export const useRecipes = () => {
  return useQuery({
    queryKey: recipeQueryKeys.lists(),
    queryFn: getRecipes,
  });
};
