import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMealPlan } from '../db/update-meal-plan';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useUpdateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MEAL_PLAN_QUERY_KEYS.all,
      });
    },
  });
};
