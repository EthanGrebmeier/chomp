import { useMutation } from '@tanstack/react-query';

import { createMealPlan } from '../instant/create-meal-plan';

export const useCreateMealPlan = () => {
  return useMutation({
    mutationFn: createMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
