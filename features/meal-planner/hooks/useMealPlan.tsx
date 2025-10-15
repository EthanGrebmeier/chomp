import { useQuery } from '@tanstack/react-query';
import { getMealPlan } from '../db/get-meal-plan';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useMealPlan = (mealPlanId: string) => {
  return useQuery({
    queryKey: MEAL_PLAN_QUERY_KEYS.detail(mealPlanId),
    queryFn: () => getMealPlan(mealPlanId),
    enabled: !!mealPlanId,
  });
};
