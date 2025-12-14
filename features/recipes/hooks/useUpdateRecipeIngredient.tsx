import { useMutation } from '@tanstack/react-query';

import { updateRecipeIngredient } from '../instant/update-recipe-ingredient';

export const useUpdateRecipeIngredient = () => {
  return useMutation({
    mutationFn: updateRecipeIngredient,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
