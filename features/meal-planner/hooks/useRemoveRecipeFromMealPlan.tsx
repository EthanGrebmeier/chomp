import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeRecipeFromMealPlan } from '../db/remove-recipe-from-meal-plan';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useRemoveRecipeFromMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeRecipeFromMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MEAL_PLAN_QUERY_KEYS.all,
      });
    },
  });
};
