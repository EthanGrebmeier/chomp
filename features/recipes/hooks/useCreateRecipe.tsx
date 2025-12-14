import { useMutation } from '@tanstack/react-query';

import { createRecipe } from '../instant/create-recipe';

export const useCreateRecipe = () => {
  return useMutation({
    mutationFn: createRecipe,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
