import { useMutation } from '@tanstack/react-query';

import { useDefaultStore } from '../../stores/instant/use-default-store';
import {
  updateMealPlanItem,
  type UpdateMealPlanItemArgs,
} from '../instant/update-meal-plan-item';

/** Updates a meal plan item, applying the default store to its linked grocery items. */
export const useUpdateMealPlanItem = () => {
  const { data: defaultStore } = useDefaultStore();

  return useMutation({
    mutationFn: (args: Omit<UpdateMealPlanItemArgs, 'defaultStore'>) =>
      updateMealPlanItem({ ...args, defaultStore }),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
