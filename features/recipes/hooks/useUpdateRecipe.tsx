import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRecipe } from '../db/update-recipe';
import { recipeQueryKeys } from '../query-keys';

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecipe,
    onSuccess: (_, variables) => {
      // Invalidate both the specific recipe and all recipes
      queryClient.invalidateQueries({
        queryKey: recipeQueryKeys.detail(variables.recipe.id),
      });
      queryClient.invalidateQueries({
        queryKey: recipeQueryKeys.lists(),
      });
    },
  });
};
