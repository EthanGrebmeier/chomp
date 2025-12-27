import { useMutation } from '@tanstack/react-query';

import { addItemToMealPlan } from '../instant/add-item-to-meal-plan';

export const useAddItemToMealPlan = () => {
  return useMutation({
    mutationFn: addItemToMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};

