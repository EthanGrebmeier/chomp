import { useMutation } from '@tanstack/react-query';
import { addRecipeIngredient } from '../db/add-recipe-ingredient';

export const useAddRecipeIngredient = () => {
  return useMutation({
    mutationFn: addRecipeIngredient,
  });
};
