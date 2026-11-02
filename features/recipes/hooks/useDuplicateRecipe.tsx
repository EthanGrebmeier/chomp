import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { navigation } from '../../../lib/navigation';
import { duplicateRecipe } from '../instant/duplicate-recipe';

export const useDuplicateRecipe = () => {
  return useMutation({
    networkMode: 'always',
    mutationFn: duplicateRecipe,
    onError: () => toast.error('Could not duplicate recipe'),
    onSuccess: result => {
      toast.success('Recipe duplicated');
      // Navigate to the new recipe
      router.push(navigation.goToRecipe(result.id));
    },
  });
};
