import { useQuery } from '@tanstack/react-query';
import { getMealPlans } from '../db/get-meal-plans';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useMealPlans = () => {
  return useQuery({
    queryKey: MEAL_PLAN_QUERY_KEYS.all,
    queryFn: getMealPlans,
  });
};
