import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRecipeIngredient } from '../db/update-recipe-ingredient';
import { recipeQueryKeys } from '../query-keys';

export const useUpdateRecipeIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecipeIngredient,
    onSuccess: (_, variables) => {
      // Invalidate both the recipe list and the specific recipe detail
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: recipeQueryKeys.detail(variables.recipeId),
      });
    },
  });
};
