import { useMutation, useQueryClient } from '@tanstack/react-query';
import { linkGroceryListToMealPlan } from '../db/link-grocery-list-to-meal-plan';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

type LinkGroceryListToMealPlanArgs = {
  mealPlanId: string;
  groceryListId: string;
};

export const useLinkGroceryListToMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkGroceryListToMealPlan,
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
