import { useMutation } from '@tanstack/react-query';

import { updateMealPlanItemDate } from '../instant/update-meal-plan-item-date';

export const useUpdateMealPlanItemDate = () => {
  return useMutation({
    mutationFn: updateMealPlanItemDate,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
