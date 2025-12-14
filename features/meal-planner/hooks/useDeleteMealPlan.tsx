import { useMutation } from '@tanstack/react-query';

import { deleteMealPlan } from '../instant/delete-meal-plan';

export const useDeleteMealPlan = () => {
  return useMutation({
    mutationFn: deleteMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
