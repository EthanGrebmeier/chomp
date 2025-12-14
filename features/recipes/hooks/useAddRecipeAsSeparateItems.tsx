import { useMutation } from '@tanstack/react-query';

import { addRecipeAsSeparateItems } from '../instant/add-recipe-separate-items';

export const useAddRecipeAsSeparateItems = () => {
  return useMutation({
    mutationFn: addRecipeAsSeparateItems,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
