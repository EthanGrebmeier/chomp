import { useQuery } from '@tanstack/react-query';

import { getActiveMealPlan } from '../db/get-active-meal-plan';
import { MEAL_PLAN_QUERY_KEYS } from '../query-keys';

export const useActiveMealPlan = () => {
  return useQuery({
    queryKey: MEAL_PLAN_QUERY_KEYS.active,
    queryFn: getActiveMealPlan,
  });
};

