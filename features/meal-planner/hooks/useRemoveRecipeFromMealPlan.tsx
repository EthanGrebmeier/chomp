import { useMutation } from '@tanstack/react-query';

import { removeRecipeFromMealPlan } from '../instant/remove-recipe-from-meal-plan';

export const useRemoveRecipeFromMealPlan = () => {
  return useMutation({
    networkMode: 'always',
    mutationFn: removeRecipeFromMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
