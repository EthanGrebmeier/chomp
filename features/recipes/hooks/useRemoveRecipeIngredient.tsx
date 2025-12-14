import { useMutation } from '@tanstack/react-query';

import { removeRecipeIngredient } from '../instant/remove-recipe-ingredient';

export const useRemoveRecipeIngredient = () => {
  return useMutation({
    mutationFn: removeRecipeIngredient,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
