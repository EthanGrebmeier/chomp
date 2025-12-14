import { useMutation } from '@tanstack/react-query';

import { incrementRecipeQuantities } from '../instant/increment-recipe-quantities';

export const useIncrementRecipeQuantities = () => {
  return useMutation({
    mutationFn: incrementRecipeQuantities,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
