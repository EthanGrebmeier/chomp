import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { navigation } from '../../../lib/navigation';
import { duplicateRecipe } from '../db/duplicate-recipe';
import { recipeQueryKeys } from '../query-keys';

export const useDuplicateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateRecipe,
    onSuccess: result => {
      // Invalidate recipes list
      queryClient.invalidateQueries({
        queryKey: recipeQueryKeys.lists(),
      });
      // Navigate to the new recipe
      router.push(navigation.goToRecipe(result.id));
    },
  });
};
