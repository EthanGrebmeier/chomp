import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { clearMealPlan } from '../instant/clear-meal-plan';

export const useClearMealPlan = () => {
  return useMutation({
    networkMode: 'always',
    onSuccess: () => toast.success('Meal plan cleared'),
    onError: () => toast.error('Could not clear meal plan'),
    mutationFn: clearMealPlan,
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
