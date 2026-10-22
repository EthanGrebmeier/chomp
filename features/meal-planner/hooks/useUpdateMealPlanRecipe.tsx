import { useMutation } from '@tanstack/react-query';

import { useDefaultStore } from '../../stores/instant/use-default-store';
import {
  updateMealPlanRecipe,
  type UpdateMealPlanRecipeArgs,
} from '../instant/update-meal-plan-recipe';

/** Updates a meal plan recipe, applying the default store to its linked grocery items. */
export const useUpdateMealPlanRecipe = () => {
  const { data: defaultStore } = useDefaultStore();

  return useMutation({
    mutationFn: (args: Omit<UpdateMealPlanRecipeArgs, 'defaultStore'>) =>
      updateMealPlanRecipe({ ...args, defaultStore }),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
