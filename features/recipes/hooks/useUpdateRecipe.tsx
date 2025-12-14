import { useMutation } from '@tanstack/react-query';

import { updateRecipe } from '../instant/update-recipe';

export const useUpdateRecipe = () => {
  return useMutation({
    mutationFn: updateRecipe,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
