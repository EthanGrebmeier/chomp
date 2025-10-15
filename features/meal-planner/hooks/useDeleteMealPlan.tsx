import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMealPlan } from '../db/delete-meal-plan';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useDeleteMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MEAL_PLAN_QUERY_KEYS.all,
      });
    },
  });
};
