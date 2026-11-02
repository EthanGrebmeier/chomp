import { useMutation } from '@tanstack/react-query';

import { deleteRecipe } from '../instant/delete-recipe';

export const useDeleteRecipe = () => {
  return useMutation({
    networkMode: 'always',
    mutationFn: deleteRecipe,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
