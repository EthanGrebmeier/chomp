import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMealPlan } from '../db/create-meal-plan';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useCreateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MEAL_PLAN_QUERY_KEYS.all,
      });
    },
  });
};
