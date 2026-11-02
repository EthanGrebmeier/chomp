import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { createRecipe } from '../instant/create-recipe';

export const useCreateRecipe = () => {
  return useMutation({
    networkMode: 'always',
    mutationFn: createRecipe,
    onSuccess: () => toast.success('Recipe created'),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
