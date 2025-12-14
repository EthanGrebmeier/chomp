import { useMutation } from '@tanstack/react-query';

import { addRecipeToMealPlan } from '../instant/add-recipe-to-meal-plan';

export const useAddRecipeToMealPlan = () => {
  return useMutation({
    mutationFn: addRecipeToMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
