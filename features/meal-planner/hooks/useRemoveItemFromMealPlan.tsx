import { useMutation } from '@tanstack/react-query';

import { removeItemFromMealPlan } from '../instant/remove-item-from-meal-plan';

export const useRemoveItemFromMealPlan = () => {
  return useMutation({
    mutationFn: removeItemFromMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};



