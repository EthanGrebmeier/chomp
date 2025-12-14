import { useMutation } from '@tanstack/react-query';

import { addRecipeIngredient } from '../instant/add-recipe-ingredient';

export const useAddRecipeIngredient = () => {
  return useMutation({
    mutationFn: addRecipeIngredient,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
