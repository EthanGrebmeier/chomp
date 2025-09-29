import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeRecipeIngredient } from '../db/remove-recipe-ingredient';
import { recipeQueryKeys } from '../query-keys';

export const useRemoveRecipeIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeRecipeIngredient,
    onSuccess: (_, variables) => {
      // Invalidate both the recipe list and the specific recipe detail
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: recipeQueryKeys.detail(variables.recipeId),
      });
    },
  });
};
