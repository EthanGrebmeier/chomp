import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRecipe } from '../db/create-recipe';
import { recipeQueryKeys } from '../query-keys';

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
    },
  });
};
