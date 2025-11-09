import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../grocery-list/query-keys';
import { addMealPlanToGroceryList } from '../db/add-meal-plan-to-grocery-list';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useAddMealPlanToGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMealPlanToGroceryList,
    onSuccess: (_, variables) => {
      // Invalidate meal plan queries to refresh the UI
      if (variables?.mealPlanId) {
        queryClient.invalidateQueries({
          queryKey: MEAL_PLAN_QUERY_KEYS.detail(variables.mealPlanId),
        });
      }

      // Invalidate grocery list queries to refresh the grocery list
      queryClient.invalidateQueries({
        queryKey: queryKeys.base(),
      });

      // Invalidate the items query
      queryClient.invalidateQueries({
        queryKey: queryKeys.items(),
      });
    },
  });
};
