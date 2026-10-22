import { useMutation } from '@tanstack/react-query';

import { useDefaultStore } from '../../stores/instant/use-default-store';
import {
  updateRecipeIngredient,
  type UpdateRecipeIngredientArgs,
} from '../instant/update-recipe-ingredient';

/** Updates a recipe ingredient, applying the default store to linked grocery items. */
export const useUpdateRecipeIngredient = () => {
  const { data: defaultStore } = useDefaultStore();

  return useMutation({
    mutationFn: (args: Omit<UpdateRecipeIngredientArgs, 'defaultStore'>) =>
      updateRecipeIngredient({ ...args, defaultStore }),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
