import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecipe } from '../db/delete-recipe';
import { recipeQueryKeys } from '../query-keys';

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
    },
  });
};
