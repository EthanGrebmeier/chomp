import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addRecipeToMealPlan } from '../db/add-recipe-to-meal-plan';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useAddRecipeToMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRecipeToMealPlan,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: MEAL_PLAN_QUERY_KEYS.detail(variables.mealPlanId),
      });
      queryClient.invalidateQueries({
        queryKey: MEAL_PLAN_QUERY_KEYS.all,
      });
    },
  });
};
