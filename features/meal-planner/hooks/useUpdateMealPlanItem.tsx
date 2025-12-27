import { useMutation } from '@tanstack/react-query';

import { updateMealPlanItem } from '../instant/update-meal-plan-item';

export const useUpdateMealPlanItem = () => {
  return useMutation({
    mutationFn: updateMealPlanItem,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};

