import { useMutation } from '@tanstack/react-query';
import { generateGroceryListFromMealPlan } from '../db/generate-grocery-list-from-meal-plan';

export const useGenerateGroceryListFromMealPlan = () => {
  return useMutation({
    mutationFn: generateGroceryListFromMealPlan,
  });
};
