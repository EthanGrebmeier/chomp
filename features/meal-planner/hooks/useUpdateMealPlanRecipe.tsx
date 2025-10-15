import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMealPlanRecipe } from '../db/update-meal-plan-recipe';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useUpdateMealPlanRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMealPlanRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MEAL_PLAN_QUERY_KEYS.all,
      });
    },
  });
};
