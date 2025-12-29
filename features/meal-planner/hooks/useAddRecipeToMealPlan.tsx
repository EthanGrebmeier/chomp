import { useMutation } from '@tanstack/react-query';

import { addRecipeToDate } from '../instant/add-recipe-to-meal-plan';

export const useAddRecipeToDate = () => {
  return useMutation({
    mutationFn: addRecipeToDate,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
