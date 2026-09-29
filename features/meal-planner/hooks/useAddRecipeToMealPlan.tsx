import { useMutation } from '@tanstack/react-query';

import { useDefaultStore } from '../../stores/instant/use-default-store';
import {
  addRecipeToDate,
  type AddRecipeToDateArgs,
} from '../instant/add-recipe-to-meal-plan';

/** Adds a recipe to the meal plan, applying the default store to its linked grocery items. */
export const useAddRecipeToDate = () => {
  const { data: defaultStore } = useDefaultStore();

  return useMutation({
    mutationFn: (args: Omit<AddRecipeToDateArgs, 'defaultStore'>) =>
      addRecipeToDate({ ...args, defaultStore }),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
