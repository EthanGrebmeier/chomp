import { useMutation } from '@tanstack/react-query';

import { updateMealPlanRecipe } from '../instant/update-meal-plan-recipe';

export const useUpdateMealPlanRecipe = () => {
  return useMutation({
    mutationFn: updateMealPlanRecipe,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
