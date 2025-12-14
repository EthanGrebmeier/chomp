import { useMutation } from '@tanstack/react-query';

import { updateMealPlan } from '../instant/update-meal-plan';

export const useUpdateMealPlan = () => {
  return useMutation({
    mutationFn: updateMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
