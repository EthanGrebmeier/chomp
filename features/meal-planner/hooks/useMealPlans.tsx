import { useMealPlans as useMealPlansQuery } from '../instant/use-meal-plans';

export const useMealPlans = () => {
  const { data, isLoading, error } = useMealPlansQuery();

  // Transform data to match the expected format
  const mealPlans = data?.meal_plans ?? [];

  return {
    data: mealPlans,
    isLoading,
    error,
  };
};
