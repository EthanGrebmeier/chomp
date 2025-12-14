import { useMutation } from '@tanstack/react-query';

import { addMealPlanToGroceryList } from '../instant/add-meal-plan-to-grocery-list';

export const useAddMealPlanToGroceryList = () => {
  return useMutation({
    mutationFn: addMealPlanToGroceryList,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
