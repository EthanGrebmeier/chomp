import { useMutation } from '@tanstack/react-query';

import { clearMealPlan } from '../instant/clear-meal-plan';

export const useClearMealPlan = () => {
  return useMutation({
    mutationFn: clearMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
