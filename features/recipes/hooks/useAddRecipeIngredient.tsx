import { useMutation } from '@tanstack/react-query';

import { useDefaultStore } from '../../stores/instant/use-default-store';
import {
  addRecipeIngredient,
  type AddRecipeIngredientArgs,
} from '../instant/add-recipe-ingredient';

/** Adds a recipe ingredient, applying the default store to linked grocery items. */
export const useAddRecipeIngredient = () => {
  const { data: defaultStore } = useDefaultStore();

  return useMutation({
    mutationFn: (args: Omit<AddRecipeIngredientArgs, 'defaultStore'>) =>
      addRecipeIngredient({ ...args, defaultStore }),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
