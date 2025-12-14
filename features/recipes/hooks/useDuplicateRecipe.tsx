import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { navigation } from '../../../lib/navigation';
import { duplicateRecipe } from '../instant/duplicate-recipe';

export const useDuplicateRecipe = () => {
  return useMutation({
    mutationFn: duplicateRecipe,
    onSuccess: result => {
      // Navigate to the new recipe
      router.push(navigation.goToRecipe(result.id));
    },
  });
};
